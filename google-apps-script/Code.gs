/**
 * MERGE THIS INTO YOUR EXISTING AzoraData Apps Script
 * ---------------------------------------------------
 * SHEET SETUP (in Google Sheets):
 * 1. Add a new tab named exactly: Billing
 * 2. Row 1 headers (copy-paste into A1:K1):
 *
 *    Invoice No | Service Date | Client Name | Phone | Email | Services | Subtotal | Discount | Total | Notes | Created At
 *
 * 3. Replace your doPost and doGet below with the updated versions
 * 4. Add the new helper functions at the bottom
 * 5. Deploy → Manage deployments → Edit → New version → Deploy
 *    (Must redeploy — saving alone is not enough)
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
      // NEW: Admin billing invoices → Billing tab
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
    // NEW: Admin requests next invoice number → AZR20260726001, AZR20260726002, ...
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "testimonials";

    if (action === "nextBillNo") {
      var dateParam = (e.parameter && e.parameter.date) ? e.parameter.date : "";
      return createJsonResponse(getNextBillNumber(dateParam));
    }

    // Existing testimonials (Feedback sheet)
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

// ---------- NEW BILLING HELPERS ----------

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

// ---------- EXISTING HELPERS (keep as-is) ----------

function createResponse(status, message) {
  return ContentService.createTextOutput(JSON.stringify({ "status": status, "message": message }))
                       .setMimeType(ContentService.MimeType.JSON);
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}
