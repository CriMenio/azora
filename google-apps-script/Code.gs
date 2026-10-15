/**
 * AZORA SALON — Google Apps Script
 * =================================
 * Handles: Contact, Booking, Feedback, Billing forms + Gallery image upload.
 *
 * SHEET SETUP (in Google Sheets):
 * - "Contact Form" tab with headers: Timestamp | Name | Email | Subject | Message
 * - "Bookings" tab with headers: Timestamp | Booking No | Name | Phone | Email | Service | Price | Duration | Stylist | Date | Time Slot | Notes
 * - "Feedback" tab with headers: Timestamp | Name | Role | Quote | Stars
 * - "Billing" tab — auto-created if missing
 * - "Gallery" tab — auto-created on first image upload
 *
 * GALLERY SETUP:
 * - Images are stored in a Google Drive folder named "Azora Gallery" (auto-created).
 * - Images are served via https://lh3.googleusercontent.com/d/<FILE_ID> (no expiry, public).
 * - The folder is made public automatically when created.
 *
 * ADMIN PIN: In Apps Script → Project Settings → Script properties,
 * add ADMIN_PIN = same value as VITE_ADMIN_PIN in .env (default: azora2024)
 *
 * DEPLOY: After editing, go to Deploy → Manage deployments → Edit → New version → Deploy.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var timestamp = new Date();

    if (data.formType === "contact") {
      var sheet = ss.getSheetByName("Contact Form");
      if (!sheet) {
        return createResponse("error", "Contact Form tab not found");
      }
      sheet.appendRow([
        timestamp,
        data.name || "",
        data.email || "",
        data.subject || "",
        data.message || ""
      ]);

    } else if (data.formType === "booking") {
      var sheet = ss.getSheetByName("Bookings");
      if (!sheet) {
        return createResponse("error", "Bookings tab not found");
      }
      sheet.appendRow([
        timestamp,
        data.bookingNo || "",
        data.name || "",
        data.phone || "",
        data.email || "",
        data.service || "",
        data.price || "",
        data.duration || "",
        data.stylist || "",
        data.date || "",
        data.timeSlot || "",
        data.notes || ""
      ]);

    } else if (data.formType === "feedback") {
      var sheet = ss.getSheetByName("Feedback");
      if (!sheet) {
        sheet = ss.insertSheet("Feedback");
        sheet.appendRow(["Timestamp", "Name", "Role", "Quote", "Stars"]);
      }
      sheet.appendRow([
        timestamp,
        data.name || "",
        data.role || "",
        data.quote || "",
        data.stars || 5
      ]);

    } else if (data.formType === "billing") {
      var billingSheet = getOrCreateBillingSheet(ss);
      billingSheet.appendRow([
        data.billNo || "",
        data.serviceDate || "",
        data.clientName || "",
        data.clientPhone || "",
        data.clientEmail || "",
        data.services || "",
        data.subtotal != null ? data.subtotal : "",
        data.discount != null ? data.discount : "",
        data.total != null ? data.total : "",
        data.notes || "",
        data.createdAt || timestamp.toISOString()
      ]);

    } else if (data.formType === "adminFetch") {
      if (!isValidAdminPin(String(data.pin || ""))) {
        return createJsonResponse({ error: "Unauthorized" });
      }
      return createJsonResponse(getAdminRecords());

    } else if (data.formType === "galleryUpload") {
      // Upload image to Google Drive, save metadata to Gallery sheet
      if (!isValidAdminPin(String(data.pin || ""))) {
        return createJsonResponse({ status: "error", error: "Unauthorized" });
      }

      try {
        var folder = getOrCreateGalleryFolder();
        var blob = Utilities.newBlob(
          Utilities.base64Decode(data.base64Data),
          data.mimeType || "image/jpeg",
          data.fileName || ("gallery_" + Date.now() + ".jpg")
        );
        var file = folder.createFile(blob);

        // Make the file publicly readable
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

        var fileId = file.getId();
        // Use Google Drive thumbnail URL for high reliability and no hotlink blocking
        var imageUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200";

        var gallerySheet = getOrCreateGallerySheet(ss);
        gallerySheet.appendRow([
          fileId,
          data.title || data.fileName || "",
          data.desc || "",
          data.type || "hair",
          imageUrl,
          timestamp.toISOString()
        ]);

        return createJsonResponse({
          status: "success",
          url: imageUrl,
          fileId: fileId,
          message: "Image uploaded successfully"
        });
      } catch (uploadError) {
        return createJsonResponse({ status: "error", error: uploadError.toString() });
      }

    } else if (data.formType === "galleryDelete") {
      // Delete image from Drive and remove from Gallery sheet
      if (!isValidAdminPin(String(data.pin || ""))) {
        return createJsonResponse({ status: "error", error: "Unauthorized" });
      }

      try {
        if (data.fileId) {
          try {
            var driveFile = DriveApp.getFileById(data.fileId);
            driveFile.setTrashed(true);
          } catch (driveErr) {
            // File may already be deleted; continue to remove sheet row
          }
        }

        // Remove row from Gallery sheet matching the fileId
        if (data.fileId) {
          var gallerySheet = ss.getSheetByName("Gallery");
          if (gallerySheet) {
            var values = gallerySheet.getDataRange().getValues();
            for (var i = values.length - 1; i >= 1; i--) {
              if (String(values[i][0]) === String(data.fileId)) {
                gallerySheet.deleteRow(i + 1);
                break;
              }
            }
          }
        }

        return createJsonResponse({ status: "success", message: "Image deleted" });
      } catch (deleteError) {
        return createJsonResponse({ status: "error", error: deleteError.toString() });
      }

    } else {
      return createResponse("error", "Unsupported or missing formType");
    }

    return createResponse("success", "Data successfully written to sheet");

  } catch (error) {
    return createResponse("error", error.toString());
  }
}

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "testimonials";

    if (action === "nextBillNo") {
      var dateParam = (e.parameter && e.parameter.date) ? e.parameter.date : "";
      return createJsonResponse(getNextBillNumber(dateParam));
    }

    if (action === "adminRecords") {
      var pin = (e.parameter && e.parameter.pin) ? String(e.parameter.pin) : "";
      if (!isValidAdminPin(pin)) {
        return createJsonResponse({ error: "Unauthorized" });
      }
      return createJsonResponse(getAdminRecords());
    }

    if (action === "gallery") {
      // Public endpoint — returns all gallery items for the public gallery page
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var gallerySheet = ss.getSheetByName("Gallery");
      if (!gallerySheet) {
        return createJsonResponse([]);
      }

      var values = gallerySheet.getDataRange().getValues();
      if (values.length <= 1) {
        return createJsonResponse([]);
      }

      var items = [];
      for (var i = 1; i < values.length; i++) {
        var fileId = values[i][0];
        var imageUrl = values[i][4];
        if (!fileId || !imageUrl) continue;
        var resolvedImage = (imageUrl && imageUrl.indexOf("drive.google.com/thumbnail") !== -1)
          ? imageUrl
          : ("https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200");
        items.push({
          id: String(i),
          fileId: String(fileId),
          title: values[i][1] || "",
          desc: values[i][2] || "",
          type: values[i][3] || "hair",
          image: resolvedImage,
          uploadedAt: values[i][5] ? String(values[i][5]) : "",
          rowIndex: i + 1
        });
      }

      // Newest first
      items.reverse();
      return createJsonResponse(items);
    }

    // Default: testimonials from Feedback sheet
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Feedback");

    if (!sheet) {
      return createJsonResponse([
        {
          name: "Ananya Mehta",
          role: "Bridal Client",
          quote: "Azora is a beautiful new salon in Kamothe! Preeti did my bridal makeup and it was absolutely stunning. She took her time, was extremely gentle, and understood exactly what look I wanted.",
          stars: 5,
          avatar: "AM"
        },
        {
          name: "Rahul Patel",
          role: "Regular Client",
          quote: "Excellent service! Visited for a haircut and beard styling. Preeti has great styling sense and the salon environment is very clean and peaceful. Highly recommend this new place.",
          stars: 5,
          avatar: "RP"
        },
        {
          name: "Priya Sharma",
          role: "Skincare Client",
          quote: "Tried their gold facial service. Preeti's 3+ years of experience really shows in her massage technique and skin service. So happy to have a high-quality salon nearby!",
          stars: 5,
          avatar: "PS"
        }
      ]);
    }

    var values = sheet.getDataRange().getValues();
    var testimonials = [];

    for (var i = 1; i < values.length; i++) {
      var name = values[i][1];
      var role = values[i][2];
      var quote = values[i][3];
      var stars = parseInt(values[i][4]) || 5;

      var avatar = "";
      if (name) {
        var parts = name.trim().split(" ");
        avatar = parts.map(function(p) { return p[0]; }).join("").substring(0, 2).toUpperCase();
      }

      testimonials.push({
        name: name,
        role: role,
        quote: quote,
        stars: stars,
        avatar: avatar || "U"
      });
    }

    testimonials.reverse();
    return createJsonResponse(testimonials);

  } catch (error) {
    return createJsonResponse({ error: error.toString() });
  }
}

// ---------- ADMIN PIN ----------

function getAdminPin() {
  var stored = PropertiesService.getScriptProperties().getProperty("ADMIN_PIN");
  return stored || "azora2024";
}

function isValidAdminPin(pin) {
  return String(pin || "") === getAdminPin();
}

// ---------- ADMIN RECORDS (read sheet data for admin panel) ----------

function formatSheetDate(value) {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return value != null ? String(value) : "";
}

function readSheetRows(sheetName, mapRow) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return [];
  }

  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) {
    return [];
  }

  var rows = [];
  for (var i = 1; i < values.length; i++) {
    rows.push(mapRow(values[i]));
  }

  rows.reverse();
  return rows;
}

function getAdminRecords() {
  var contacts = readSheetRows("Contact Form", function(row) {
    return {
      timestamp: formatSheetDate(row[0]),
      name: row[1] || "",
      email: row[2] || "",
      subject: row[3] || "",
      message: row[4] || ""
    };
  });

  var bookings = readSheetRows("Bookings", function(row) {
    return {
      timestamp: formatSheetDate(row[0]),
      bookingNo: row[1] || "",
      name: row[2] || "",
      phone: row[3] || "",
      email: row[4] || "",
      service: row[5] || "",
      price: row[6] || "",
      duration: row[7] || "",
      stylist: row[8] || "",
      date: row[9] || "",
      timeSlot: row[10] || "",
      notes: row[11] || ""
    };
  });

  var feedback = readSheetRows("Feedback", function(row) {
    return {
      timestamp: formatSheetDate(row[0]),
      name: row[1] || "",
      role: row[2] || "",
      quote: row[3] || "",
      stars: parseInt(row[4], 10) || 5
    };
  });

  var billing = readSheetRows("Billing", function(row) {
    return {
      billNo: row[0] || "",
      serviceDate: row[1] || "",
      clientName: row[2] || "",
      phone: row[3] || "",
      email: row[4] || "",
      services: row[5] || "",
      subtotal: row[6] != null ? row[6] : "",
      discount: row[7] != null ? row[7] : "",
      total: row[8] != null ? row[8] : "",
      notes: row[9] || "",
      createdAt: formatSheetDate(row[10])
    };
  });

  return {
    contacts: contacts,
    bookings: bookings,
    feedback: feedback,
    billing: billing,
    counts: {
      contacts: contacts.length,
      bookings: bookings.length,
      feedback: feedback.length,
      billing: billing.length
    }
  };
}

// ---------- BILLING HELPERS ----------

var BILL_PREFIX = "AZR";

function getOrCreateBillingSheet(ss) {
  var sheet = ss.getSheetByName("Billing");
  if (!sheet) {
    sheet = ss.insertSheet("Billing");
    sheet.appendRow([
      "Invoice No",
      "Service Date",
      "Client Name",
      "Phone",
      "Email",
      "Services",
      "Subtotal",
      "Discount",
      "Total",
      "Notes",
      "Created At"
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function normalizeDateKey(dateStr) {
  var raw = String(dateStr || "").replace(/-/g, "").trim();
  if (!/^\d{8}$/.test(raw)) {
    throw new Error("Invalid date. Use YYYYMMDD or YYYY-MM-DD");
  }
  return raw;
}

function getNextBillNumber(dateStr) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateBillingSheet(ss);
  var dateKey = normalizeDateKey(dateStr);
  var prefix = BILL_PREFIX + dateKey;
  var values = sheet.getDataRange().getValues();
  var maxSeq = 0;

  for (var i = 1; i < values.length; i++) {
    var billNo = String(values[i][0] || "");
    if (billNo.indexOf(prefix) === 0) {
      var seq = parseInt(billNo.substring(prefix.length), 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  var nextSeq = maxSeq + 1;
  var nextBillNo = prefix + ("000" + nextSeq).slice(-3);

  return {
    nextBillNo: nextBillNo,
    prefix: prefix,
    sequence: nextSeq,
    dateKey: dateKey
  };
}

// ---------- GALLERY HELPERS ----------

function getOrCreateGalleryFolder() {
  var folderName = "Azora Gallery";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function getOrCreateGallerySheet(ss) {
  var sheet = ss.getSheetByName("Gallery");
  if (!sheet) {
    sheet = ss.insertSheet("Gallery");
    sheet.appendRow([
      "File ID",
      "Title",
      "Description",
      "Type",
      "Image URL",
      "Uploaded At"
    ]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(5, 450);
  }
  return sheet;
}

// ---------- RESPONSE HELPERS ----------

function createResponse(status, message) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: status, message: message }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
