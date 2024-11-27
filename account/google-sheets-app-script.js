// SCRIPTS FOR USE WITH THE GOOGLE SHEETS APP SCRIPT

// Adds a unix timestamp to each word on creation for unique id keeping
function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() === "Dictionary") {
    var actRng = sheet.getActiveRange();
    var editColumn = actRng.getColumn();
    var rowIndex = actRng.getRowIndex();
    var dateCol = 1;
    var orderCol = 3;
    if (editColumn == orderCol) {
      sheet.getRange(rowIndex, dateCol).setValue(new Date().getTime());
    }
  }
}

function onOpen() {
  var menuEntries = [
    {name: "Go to Cell", functionName: "goToCell"},
    {name: "Go to Row", functionName: "goToRow"},
    {name: "Go to 1st empty Row", functionName: "selectFirstEmptyRow"},
    {name: "Expand Part of Speech Abbreviations", functionName: "expandPartsOfSpeech"},
    {name: "Standardize Pashto", functionName: "standardizePashtoColumns"},
    {name: "Standardize Phonetics", functionName: "standardizePhonetics"},
    {name: "Find Unlinked Compound Verb", functionName: "selectUnlinkedCompound"},
  ];
  SpreadsheetApp.getActiveSpreadsheet().addMenu("MyUtils", menuEntries);
}

function standardizePashtoText(input) {
    return input.trim().replace(/\u0649/g, "\u06cc")
        // Arabic ك replace with ک
        .replace(/\u0643/g, "\u06a9")
        // Farsi گ replaced with ګ
        .replace(/گ/g, "ګ")
        // Replace ي s in the middle of words to ی
        .replace(/ي(?=[\u0600-\u060b\u060d-\u06ff])/g, "ی")
        // Replace آ two character version with combined آ character
         .replace(/آ/g, "آ");
}

var pashtoColumns = ["J", "L", "O", "Q", "S", "U", "W", "Y", "AA"];
var phoneticsColumns = ["K","M", "P", "R", "T", "V", "X", "Z", "AB"];

function standardizePashtoColumns() {
  for(var h=0;h<pashtoColumns.length;h++) {
    var rng = SpreadsheetApp.getActiveSheet().getRange(pashtoColumns[h]+":"+pashtoColumns[h]);
    var rngA = rng.getValues();
    for(var i=1;i<rngA.length;i++) {
      if (rngA[i][0]) {
        rngA[i][0] = standardizePashtoText(rngA[i][0]);
      }
    }
    rng.setValues(rngA);
  }
}
    
function expandPartsOfSpeech() {
    const rng = SpreadsheetApp.getActiveSheet().getRange("E:E");
    const rngA = rng.getValues();
    for(var i=1;i<rngA.length;i++) {
        rngA[i][0] = rngA[i][0].replace(/tr\./g, "trans.");
        rngA[i][0] = rngA[i][0].replace(/int\./g, "intrans.");
        rngA[i][0] = rngA[i][0].replace(/sc\./g, "stat. comp.");
        rngA[i][0] = rngA[i][0].replace(/dc\./g, "dyn. comp.");
    }
    rng.setValues(rngA);
}
  
function standardizePhonetics() {
    for(var h=0;h<phoneticsColumns.length;h++) {
      const rng = SpreadsheetApp.getActiveSheet().getRange(phoneticsColumns[h]+":"+phoneticsColumns[h]);
      const rngA = rng.getValues();
      for(var i=1;i<rngA.length;i++) {
          rngA[i][0] = rngA[i][0].replace(/’/g, "'").trim();
      }
      rng.setValues(rngA);
    }
}

function goToCell() {
  var strRange = Browser.inputBox("Insert the required cell (e.g.: B351):", Browser.Buttons.OK_CANCEL);
  if(strRange != "cancel") {
    try {
      SpreadsheetApp.getActiveSheet().getRange(strRange).activate();
    }
    catch(e) {Browser.msgBox(e.message);}
  }
}

function goToRow() {
  var strRange = Browser.inputBox("Insert the required row number (e.g.: 132):", Browser.Buttons.OK_CANCEL);
  if(strRange != "cancel") {
    try {
      strRange = "A" + strRange
      SpreadsheetApp.getActiveSheet().getRange(strRange).activate();
    }
    catch(e) {
      Browser.msgBox(e.message);
    }
  }
}

function selectFirstEmptyRow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  sheet.setActiveSelection(sheet.getRange("A"+getFirstEmptyRowWholeRow()));
}
  
function selectUnlinkedCompound() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  sheet.setActiveSelection(sheet.getRange("F"+getFirstUnlinkedCompound()));
}
  
function getFirstUnlinkedCompound() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  var row = 0;
  function linkExists(link) {
    for (var r=0; r<values.length; r++) {
      if (link === values[r][0]) return true;
    }
    return false;
  }
  for (var row=0; row<values.length; row++) {
    var ps = values[row][4];
    if ((typeof ps === "string") && ps.indexOf("comp.")>-1) {
      // check if there is a link to another word on the compound word
      var linkToWord = values[row][5];
      if (!linkToWord) break;
      // check if the link is valid
      if (!linkExists(linkToWord)) return row+1;
    };
  }
  return row+1;
}
  

function getFirstEmptyRowWholeRow() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var range = sheet.getDataRange();
  var values = range.getValues();
  var row = 0;
  for (var row=0; row<values.length; row++) {
    if (!values[row].join("")) break;
  }
  return (row+1);
}
