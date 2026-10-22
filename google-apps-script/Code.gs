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
 * - "Offers" tab — auto-created with headers: Timestamp | Site Visibility | Poster Location / URL | Poster Super-Title | Offer Title / Heading | Description | Offer Validity | Tags | Packages with Amount | Packages Raw JSON
 * - "Customers" (or "Custmers") tab — auto-created with headers: Timestamp | Customer ID | Full Name | Phone | Email | Address | Services Availed | Reference Source | Visit Date | Rating | Feedback / Review | Stylist Remarks | Photos Count | Photo URLs | Updated At
 *
 * GALLERY SETUP:
 * - Images are stored in a Google Drive folder named "Azora Gallery" (auto-created).
 * - Images are served via https://lh3.googleusercontent.com/d/<FILE_ID> (no expiry, public).
 * - The folder is made public automatically when created.
 *
 * ADMIN PIN: In Apps Script → Project Settings → Script properties,
 * add ADMIN_PIN = same value as VITE_ADMIN_PIN in .env (default: azora2024)
 *
 * WHATSAPP & EMAIL NOTIFICATIONS (AUTOMATIC BOOKING ALERTS):
 * In Apps Script → Project Settings → Script properties:
 * - WHATSAPP_GATEWAY_URL : URL from your WhatsApp Gateway (e.g. UltraMsg: https://api.ultramsg.com/INSTANCE_ID/messages/chat)
 * - WHATSAPP_TOKEN       : Token / API Key from your WhatsApp Gateway
 * - AZORA_WHATSAPP_NUMBER: 917021929588 (or your salon's WhatsApp phone number with country code, no +)
 * - NOTIFICATION_EMAIL   : azorasalon@gmail.com (optional backup email alert)
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

      // Automatically send WhatsApp & Email booking alert to Azora Salon
      sendBookingNotifications(data);

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

    } else if (data.formType === "saveOffer") {
      // Save offer details, poster image, and festival combos to Offers sheet
      if (!isValidAdminPin(String(data.pin || ""))) {
        return createJsonResponse({ status: "error", error: "Unauthorized" });
      }

      try {
        var offersSheet = getOrCreateOffersSheet(ss);
        var imageUrl = data.image || "";

        // If a new poster image is uploaded as base64, store it in Google Drive
        if (data.base64Poster) {
          try {
            var folder = getOrCreateGalleryFolder();
            var blob = Utilities.newBlob(
              Utilities.base64Decode(data.base64Poster),
              data.mimeType || "image/jpeg",
              "offer_poster_" + Date.now() + ".jpg"
            );
            var file = folder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            var fileId = file.getId();
            imageUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200";
          } catch (driveErr) {
            Logger.log("Drive upload error for offer poster: " + driveErr);
          }
        }

        var tagsString = Array.isArray(data.tags) ? data.tags.join(", ") : (data.tags || "");
        var combosJson = JSON.stringify(Array.isArray(data.combos) ? data.combos : []);
        var combosSummary = Array.isArray(data.combos)
          ? data.combos.map(function(c, idx) {
              var line = (idx + 1) + ". " + (c.name || "Package") + " — " + (c.price || "") + (c.category ? " [" + c.category + "]" : "");
              if (c.desc) line += "\n   Includes: " + c.desc;
              return line;
            }).join("\n\n")
          : "";

        var siteVisibility = (data.isActive !== false) ? "Visible" : "Hidden";

        // Append row matching exact user requirements:
        // Timestamp | Site Visibility | Poster Location / URL | Poster Super-Title | Offer Title / Heading | Description | Offer Validity | Tags | Packages with Amount | Packages Raw JSON
        offersSheet.appendRow([
          timestamp.toISOString(),
          siteVisibility,
          imageUrl,
          data.badge || "",
          data.title || "",
          data.desc || "",
          data.dateRange || "",
          tagsString,
          combosSummary,
          combosJson
        ]);

        // Enable text wrapping for the Packages with Amount column for clean readability
        try {
          var lastRowNum = offersSheet.getLastRow();
          offersSheet.getRange(lastRowNum, 9).setWrap(true);
        } catch (wrapErr) {
          // Non-critical if wrapping fails
        }

        return createJsonResponse({
          status: "success",
          message: "Offer saved to Google Sheet successfully",
          config: {
            isActive: data.isActive !== false,
            title: data.title || "",
            badge: data.badge || "",
            desc: data.desc || "",
            dateRange: data.dateRange || "",
            tags: Array.isArray(data.tags) ? data.tags : [],
            image: imageUrl,
            combos: Array.isArray(data.combos) ? data.combos : [],
            updatedAt: timestamp.toISOString()
          }
        });
      } catch (saveErr) {
        return createJsonResponse({ status: "error", error: saveErr.toString() });
      }

    } else if (data.formType === "saveCustomer") {
      // Save or update customer profile in Customers tab
      if (!isValidAdminPin(String(data.pin || ""))) {
        return createJsonResponse({ status: "error", error: "Unauthorized" });
      }

      try {
        var sheet = getOrCreateCustomersSheet(ss);
        var customerId = data.id || ("cust-" + Date.now());
        var imageUrls = [];

        // If customer photos are provided, upload any base64 images to Google Drive
        if (Array.isArray(data.images) && data.images.length > 0) {
          var customerFolder = null;
          for (var imgIdx = 0; imgIdx < data.images.length; imgIdx++) {
            var imgItem = data.images[imgIdx];
            if (typeof imgItem === "string" && imgItem.indexOf("data:image") === 0) {
              try {
                if (!customerFolder) {
                  customerFolder = getOrCreateCustomerMakeoverFolder();
                }
                var commaIdx = imgItem.indexOf(",");
                var mimeMatch = imgItem.match(/data:([^;]+);/);
                var mimeType = (mimeMatch && mimeMatch[1]) ? mimeMatch[1] : "image/jpeg";
                var base64Content = imgItem.substring(commaIdx + 1);
                var ext = mimeType.indexOf("png") !== -1 ? ".png" : ".jpg";
                var fileName = "makeover_" + String(data.fullName || "client").replace(/[^a-zA-Z0-9]/g, "_") + "_" + Date.now() + "_" + (imgIdx + 1) + ext;

                var blob = Utilities.newBlob(Utilities.base64Decode(base64Content), mimeType, fileName);
                var driveFile = customerFolder.createFile(blob);
                driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
                var fileId = driveFile.getId();
                var photoUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w1200";
                imageUrls.push(photoUrl);
              } catch (driveErr) {
                Logger.log("Customer image upload error: " + driveErr);
              }
            } else if (typeof imgItem === "string" && imgItem.indexOf("http") === 0) {
              imageUrls.push(imgItem);
            }
          }
        }

        var photosCount = imageUrls.length || (Array.isArray(data.images) ? data.images.length : 0);
        var photosString = imageUrls.join("\n");

        var values = sheet.getDataRange().getValues();
        var existingRowIndex = -1;

        // Search for existing row by ID (column 2) or Phone (column 4)
        for (var r = 1; r < values.length; r++) {
          var rowId = String(values[r][1] || "");
          var rowPhone = String(values[r][3] || "").replace(/\D/g, "");
          var searchPhone = String(data.phone || "").replace(/\D/g, "");

          if ((data.id && rowId === String(data.id)) || (searchPhone && rowPhone && rowPhone === searchPhone)) {
            existingRowIndex = r + 1; // 1-indexed row number
            customerId = rowId || customerId;
            break;
          }
        }

        var rowData = [
          existingRowIndex !== -1 ? values[existingRowIndex - 1][0] : timestamp.toISOString(),
          customerId,
          data.fullName || "",
          data.phone || "",
          data.email || "",
          data.address || "",
          data.service || "",
          data.reference || "",
          data.visitDate || "",
          data.rating != null ? data.rating : 5,
          data.feedback || "",
          data.remarks || "",
          photosCount,
          photosString,
          timestamp.toISOString()
        ];

        if (existingRowIndex !== -1) {
          sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }

        return createJsonResponse({
          status: "success",
          message: existingRowIndex !== -1 ? "Customer updated in Customers sheet" : "New customer saved to Customers sheet",
          customer: {
            id: customerId,
            fullName: data.fullName || "",
            phone: data.phone || "",
            email: data.email || "",
            address: data.address || "",
            service: data.service || "",
            reference: data.reference || "",
            visitDate: data.visitDate || "",
            rating: data.rating != null ? data.rating : 5,
            feedback: data.feedback || "",
            remarks: data.remarks || "",
            images: imageUrls.length > 0 ? imageUrls : (Array.isArray(data.images) ? data.images : []),
            photosCount: photosCount,
            updatedAt: timestamp.toISOString()
          }
        });
      } catch (custErr) {
        return createJsonResponse({ status: "error", error: custErr.toString() });
      }

    } else if (data.formType === "deleteCustomer") {
      // Remove customer row from Customers tab
      if (!isValidAdminPin(String(data.pin || ""))) {
        return createJsonResponse({ status: "error", error: "Unauthorized" });
      }

      try {
        var sheet = getOrCreateCustomersSheet(ss);
        var values = sheet.getDataRange().getValues();
        var targetId = String(data.id || "").trim();
        var targetPhone = String(data.phone || "").replace(/\D/g, "");
        var deleted = false;

        for (var i = values.length - 1; i >= 1; i--) {
          var rowId = String(values[i][1] || "").trim();
          var rowPhone = String(values[i][3] || "").replace(/\D/g, "");

          if ((targetId && rowId === targetId) || (targetPhone && rowPhone && rowPhone === targetPhone)) {
            sheet.deleteRow(i + 1);
            deleted = true;
            break;
          }
        }

        return createJsonResponse({
          status: "success",
          message: deleted ? "Customer removed from Customers sheet" : "Customer record not found in sheet",
          deleted: deleted
        });
      } catch (delErr) {
        return createJsonResponse({ status: "error", error: delErr.toString() });
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

    if (action === "syncReviews") {
      var pin = (e.parameter && e.parameter.pin) ? String(e.parameter.pin) : "";
      if (!isValidAdminPin(pin)) {
        return createJsonResponse({ error: "Unauthorized" });
      }
      return createJsonResponse(syncGoogleReviews());
    }

    if (action === "customers") {
      var pin = (e.parameter && e.parameter.pin) ? String(e.parameter.pin) : "";
      if (!isValidAdminPin(pin)) {
        return createJsonResponse({ error: "Unauthorized" });
      }
      var records = getAdminRecords();
      return createJsonResponse(records.customers || []);
    }

    if (action === "offers") {
      // Public endpoint — returns latest active offer configuration & poster from Offers sheet
      var latestOffer = getLatestOfferConfig(SpreadsheetApp.getActiveSpreadsheet());
      return createJsonResponse(latestOffer || { status: "not_found" });
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

  var offersHistory = readSheetRows("Offers", function(row) {
    return {
      timestamp: formatSheetDate(row[0]),
      visibility: String(row[1] || ""),
      posterUrl: String(row[2] || ""),
      badge: String(row[3] || ""),
      title: String(row[4] || ""),
      desc: String(row[5] || ""),
      dateRange: String(row[6] || ""),
      tags: String(row[7] || ""),
      packages: String(row[8] || "")
    };
  });

  // Read Customers / Custmers sheet
  var customers = readSheetRows("Customers", function(row) {
    var rawUrls = String(row[13] || "");
    var images = rawUrls ? rawUrls.split("\n").filter(Boolean) : [];
    return {
      timestamp: formatSheetDate(row[0]),
      id: row[1] || "",
      fullName: row[2] || "",
      phone: row[3] || "",
      email: row[4] || "",
      address: row[5] || "",
      service: row[6] || "",
      reference: row[7] || "",
      visitDate: row[8] || "",
      rating: parseInt(row[9], 10) || 5,
      feedback: row[10] || "",
      remarks: row[11] || "",
      photosCount: parseInt(row[12], 10) || 0,
      photoUrls: rawUrls,
      images: images,
      updatedAt: formatSheetDate(row[14])
    };
  });

  if (customers.length === 0) {
    customers = readSheetRows("Custmers", function(row) {
      var rawUrls = String(row[13] || "");
      var images = rawUrls ? rawUrls.split("\n").filter(Boolean) : [];
      return {
        timestamp: formatSheetDate(row[0]),
        id: row[1] || "",
        fullName: row[2] || "",
        phone: row[3] || "",
        email: row[4] || "",
        address: row[5] || "",
        service: row[6] || "",
        reference: row[7] || "",
        visitDate: row[8] || "",
        rating: parseInt(row[9], 10) || 5,
        feedback: row[10] || "",
        remarks: row[11] || "",
        photosCount: parseInt(row[12], 10) || 0,
        photoUrls: rawUrls,
        images: images,
        updatedAt: formatSheetDate(row[14])
      };
    });
  }

  return {
    contacts: contacts,
    bookings: bookings,
    feedback: feedback,
    billing: billing,
    customers: customers,
    offersHistory: offersHistory,
    offers: getLatestOfferConfig(),
    counts: {
      contacts: contacts.length,
      bookings: bookings.length,
      feedback: feedback.length,
      billing: billing.length,
      customers: customers.length,
      offers: offersHistory.length
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

// ---------- OFFERS HELPERS ----------

function getOrCreateOffersSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Offers");
  var headers = [
    "Timestamp",
    "Site Visibility",
    "Poster Location / URL",
    "Poster Super-Title",
    "Offer Title / Heading",
    "Description",
    "Offer Validity",
    "Tags",
    "Packages with Amount",
    "Packages Raw JSON"
  ];

  if (!sheet) {
    sheet = ss.insertSheet("Offers");
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160); // Timestamp
    sheet.setColumnWidth(2, 110); // Site Visibility
    sheet.setColumnWidth(3, 260); // Poster Location / URL
    sheet.setColumnWidth(4, 180); // Super-Title
    sheet.setColumnWidth(5, 200); // Title / Heading
    sheet.setColumnWidth(6, 280); // Description
    sheet.setColumnWidth(7, 140); // Validity
    sheet.setColumnWidth(8, 220); // Tags
    sheet.setColumnWidth(9, 360); // Packages with Amount
    sheet.setColumnWidth(10, 200); // Raw JSON
  } else if (sheet.getLastRow() === 0) {
    // Tab exists but is empty
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160);
    sheet.setColumnWidth(2, 110);
    sheet.setColumnWidth(3, 260);
    sheet.setColumnWidth(4, 180);
    sheet.setColumnWidth(5, 200);
    sheet.setColumnWidth(6, 280);
    sheet.setColumnWidth(7, 140);
    sheet.setColumnWidth(8, 220);
    sheet.setColumnWidth(9, 360);
    sheet.setColumnWidth(10, 200);
  }
  return sheet;
}

function getLatestOfferConfig(ss) {
  try {
    if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Offers");
    if (!sheet) return null;

    var values = sheet.getDataRange().getValues();
    if (values.length <= 1) return null;

    var headers = values[0].map(function(h) { return String(h).trim().toLowerCase(); });
    var lastRow = values[values.length - 1];

    function getColValue(possibleNames, fallbackIndex) {
      for (var i = 0; i < possibleNames.length; i++) {
        var idx = headers.indexOf(possibleNames[i].toLowerCase());
        if (idx !== -1 && lastRow[idx] !== undefined && lastRow[idx] !== "") {
          return lastRow[idx];
        }
      }
      if (fallbackIndex !== undefined && fallbackIndex < lastRow.length) {
        return lastRow[fallbackIndex];
      }
      return "";
    }

    var rawVisibility = getColValue(["Site Visibility", "Is Active"], 1);
    var isActive = true;
    if (
      rawVisibility === false ||
      String(rawVisibility).toLowerCase() === "false" ||
      String(rawVisibility).toLowerCase() === "hidden"
    ) {
      isActive = false;
    }

    var posterUrl = String(getColValue(["Poster Location / URL", "Poster Image URL", "Poster Location"], 2) || "");
    var badge = String(getColValue(["Poster Super-Title", "Badge", "Super-Title"], 3) || "");
    var title = String(getColValue(["Offer Title / Heading", "Title", "Heading"], 4) || "");
    var desc = String(getColValue(["Description", "Desc"], 5) || "");
    var dateRange = String(getColValue(["Offer Validity", "Date Range", "Validity"], 6) || "");

    var rawTags = getColValue(["Tags"], 7);
    var tags = [];
    if (rawTags) {
      tags = String(rawTags).split(",").map(function(t) { return t.trim(); }).filter(Boolean);
    }

    var rawJson = getColValue(["Packages Raw JSON", "Combos JSON", "Packages JSON"], 9);
    var combos = [];
    if (rawJson) {
      try {
        combos = JSON.parse(rawJson);
      } catch (e) {
        combos = [];
      }
    }

    return {
      isActive: isActive,
      title: title,
      badge: badge,
      desc: desc,
      dateRange: dateRange,
      tags: tags,
      image: posterUrl,
      combos: combos,
      updatedAt: lastRow[0] ? String(lastRow[0]) : ""
    };
  } catch (err) {
    Logger.log("getLatestOfferConfig error: " + err);
    return null;
  }
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

// ---------- AUTOMATIC BOOKING NOTIFICATION HELPERS ----------

/**
 * Automatically sends WhatsApp & Email notifications directly to Azora Salon
 * when a user books an appointment on the website.
 */
function sendBookingNotifications(data) {
  try {
    var props = PropertiesService.getScriptProperties();
    var salonPhone = props.getProperty("AZORA_WHATSAPP_NUMBER") || "917021929588";
    var gatewayUrl = props.getProperty("WHATSAPP_GATEWAY_URL") || "";
    var token = props.getProperty("WHATSAPP_TOKEN") || "";
    var notificationEmail = props.getProperty("NOTIFICATION_EMAIL") || "";

    var message = [
      "🔔 *NEW APPOINTMENT BOOKING - AZORA SALON*",
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "📌 *Booking ID:* " + (data.bookingNo || "N/A"),
      "👤 *Client Name:* " + (data.name || "N/A"),
      "📞 *Phone:* " + (data.phone || "N/A"),
      data.email ? "✉️ *Email:* " + data.email : null,
      "💇 *Services:* " + (data.service || "N/A"),
      "⭐ *Stylist:* " + (data.stylist || "Preeti"),
      "📅 *Date:* " + (data.date || "N/A"),
      "⏰ *Time Slot:* " + (data.timeSlot || "N/A"),
      data.notes ? "📝 *Notes:* " + data.notes : null,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      "_Sent automatically by Azora Salon System_"
    ].filter(Boolean).join("\n");

    // 1. Send via WhatsApp Gateway (UltraMsg, Green API, Twilio, etc.)
    if (gatewayUrl) {
      try {
        var payload = {
          token: token,
          to: salonPhone,
          body: message,
          message: message // compatibility across providers
        };

        var response = UrlFetchApp.fetch(gatewayUrl, {
          method: "post",
          contentType: "application/json",
          payload: JSON.stringify(payload),
          muteHttpExceptions: true
        });
        Logger.log("WhatsApp gateway response: " + response.getContentText());
      } catch (waErr) {
        Logger.log("WhatsApp notification error: " + waErr);
      }
    } else {
      Logger.log("WHATSAPP_GATEWAY_URL not set in Script Properties. Skipping WhatsApp call.");
    }

    // 2. Send backup email notification (works 100% free with no gateway needed)
    try {
      var recipient = notificationEmail || Session.getActiveUser().getEmail();
      if (recipient) {
        MailApp.sendEmail({
          to: recipient,
          subject: "🔔 New Booking: " + (data.name || "Client") + " (" + (data.date || "") + " " + (data.timeSlot || "") + ")",
          body: message.replace(/\*/g, "").replace(/━+/g, "------------------------------------")
        });
      }
    } catch (mailErr) {
      Logger.log("Email notification error: " + mailErr);
    }
  } catch (err) {
    Logger.log("sendBookingNotifications error: " + err);
  }
}

// ---------- GOOGLE REVIEWS AUTO-SYNC ----------

/**
 * Creates a convenient custom menu in Google Sheets
 * to trigger review sync with one click.
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("Azora Salon")
      .addItem("🔄 Sync Google Reviews Now", "syncGoogleReviews")
      .addToUi();
  } catch (e) {
    // onOpen might run in context without UI (e.g. triggers), safe to ignore
  }
}

/**
 * Automatically fetches top 5 Google Reviews using Google Places API
 * and appends any new reviews into the "Feedback" sheet.
 */
function syncGoogleReviews() {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty("GOOGLE_PLACES_API_KEY");
  var placeId = props.getProperty("GOOGLE_PLACE_ID"); // Azora Salon's Place ID

  if (!apiKey || !placeId) {
    var errorMsg = "Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID in Script Properties.";
    Logger.log(errorMsg);
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(errorMsg, "Google Reviews Sync", 8);
    } catch (e) {}
    return { status: "error", message: errorMsg };
  }

  var url = "https://maps.googleapis.com/maps/api/place/details/json"
    + "?place_id=" + encodeURIComponent(placeId)
    + "&fields=name,rating,reviews"
    + "&reviews_sort=newest"
    + "&key=" + encodeURIComponent(apiKey);

  try {
    var response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var data = JSON.parse(response.getContentText());

    if (data.status !== "OK" || !data.result || !data.result.reviews) {
      var apiErr = "Places API error: " + (data.error_message || data.status);
      Logger.log(apiErr);
      try {
        SpreadsheetApp.getActiveSpreadsheet().toast(apiErr, "Google Reviews Sync", 8);
      } catch (e) {}
      return { status: "error", message: apiErr };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Feedback");
    if (!sheet) {
      sheet = ss.insertSheet("Feedback");
      sheet.appendRow(["Timestamp", "Name", "Role", "Quote", "Stars"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold");
    }

    var existingQuotes = sheet.getDataRange().getValues().map(function(row) {
      return String(row[3] || "").trim().toLowerCase();
    });

    var reviews = data.result.reviews;
    var addedCount = 0;

    for (var i = 0; i < reviews.length; i++) {
      var r = reviews[i];
      var quoteText = (r.text || "").trim();

      // Only import 4-star and 5-star reviews with text that aren't already in the sheet
      if (r.rating >= 4 && quoteText && existingQuotes.indexOf(quoteText.toLowerCase()) === -1) {
        var reviewDate = r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString();
        sheet.appendRow([
          reviewDate,
          r.author_name || "Google User",
          "Google Verified Review",
          quoteText,
          r.rating || 5
        ]);
        existingQuotes.push(quoteText.toLowerCase());
        addedCount++;
      }
    }

    var resultMsg = "Successfully imported " + addedCount + " new Google review(s).";
    Logger.log(resultMsg);
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(resultMsg, "Google Reviews Sync", 5);
    } catch (e) {}

    return { status: "success", added: addedCount, message: resultMsg };
  } catch (err) {
    var catchErr = "Failed to sync Google reviews: " + err.toString();
    Logger.log(catchErr);
    try {
      SpreadsheetApp.getActiveSpreadsheet().toast(catchErr, "Google Reviews Sync", 8);
    } catch (e) {}
    return { status: "error", message: catchErr };
  }
}

// ---------- CUSTOMERS HELPERS ----------

function getOrCreateCustomerMakeoverFolder() {
  var folderName = "Azora Customer Makeovers";
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var folder = DriveApp.createFolder(folderName);
  folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return folder;
}

function getOrCreateCustomersSheet(ss) {
  if (!ss) ss = SpreadsheetApp.getActiveSpreadsheet();
  // Support either "Customers" or "Custmers" tab
  var sheet = ss.getSheetByName("Customers") || ss.getSheetByName("Custmers");
  var headers = [
    "Timestamp",
    "Customer ID",
    "Full Name",
    "Phone",
    "Email",
    "Address",
    "Services Availed",
    "Reference Source",
    "Visit Date",
    "Rating",
    "Feedback / Review",
    "Stylist Remarks",
    "Photos Count",
    "Photo URLs",
    "Updated At"
  ];

  if (!sheet) {
    sheet = ss.insertSheet("Customers");
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 160); // Timestamp
    sheet.setColumnWidth(2, 140); // Customer ID
    sheet.setColumnWidth(3, 180); // Full Name
    sheet.setColumnWidth(4, 130); // Phone
    sheet.setColumnWidth(5, 180); // Email
    sheet.setColumnWidth(6, 220); // Address
    sheet.setColumnWidth(7, 240); // Services
    sheet.setColumnWidth(8, 160); // Reference
    sheet.setColumnWidth(11, 260); // Feedback
    sheet.setColumnWidth(12, 260); // Stylist Remarks
  }
  return sheet;
}

