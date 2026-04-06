// =============================================================
//  Google Apps Script — Quiz Results Backend
//  Copy this entire file into a Google Apps Script project.
//  See SETUP instructions below.
// =============================================================
//
//  SETUP (5 minutes):
//
//  1. Go to https://script.google.com and click "New project"
//  2. Delete the default code and paste this entire file
//  3. Click "Run" > select "setup" function > click Run
//     - Authorize when prompted (this creates the spreadsheet)
//     - Check the Execution Log for the Spreadsheet URL — open it
//  4. Click "Deploy" > "New deployment"
//     - Type: "Web app"
//     - Execute as: "Me"
//     - Who has access: "Anyone"
//     - Click "Deploy" and copy the Web App URL
//  5. Paste that URL in two places:
//     a) On the quiz page: open browser console and run:
//        localStorage.setItem('quiz_script_url', 'YOUR_URL_HERE')
//        Then reload the quiz page.
//     b) On the results dashboard page: paste it in the input field.
//
// =============================================================

const SHEET_NAME = 'Quiz Results';

function setup() {
  const ss = SpreadsheetApp.create('Brazilian Mass Market Quiz — Results');
  const sheet = ss.getActiveSheet();
  sheet.setName(SHEET_NAME);
  sheet.appendRow([
    'Timestamp', 'Score', 'Total', 'Percentage',
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6',
    'Q1_Chosen', 'Q2_Chosen', 'Q3_Chosen', 'Q4_Chosen', 'Q5_Chosen', 'Q6_Chosen',
    'Q1_Text', 'Q2_Text', 'Q3_Text', 'Q4_Text', 'Q5_Text', 'Q6_Text'
  ]);
  sheet.getRange('1:1').setFontWeight('bold');
  const id = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', id);
  Logger.log('Spreadsheet created: ' + ss.getUrl());
}

function getSheet() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  return SpreadsheetApp.openById(id).getSheetByName(SHEET_NAME);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getSheet();
    const answers = data.answers || [];
    const row = [
      data.timestamp || new Date().toISOString(),
      data.score,
      data.total,
      data.percentage
    ];
    for (let i = 0; i < 6; i++) {
      row.push(answers[i] ? (answers[i].is_correct ? 'Correct' : 'Wrong') : '');
    }
    for (let i = 0; i < 6; i++) {
      row.push(answers[i] ? answers[i].chosen : '');
    }
    for (let i = 0; i < 6; i++) {
      row.push(answers[i] ? answers[i].question : '');
    }
    sheet.appendRow(row);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  const result = rows.map(row => {
    const answers = [];
    for (let i = 0; i < 6; i++) {
      answers.push({
        question: row[16 + i] || ('Q' + (i + 1)),
        is_correct: row[4 + i] === 'Correct',
        chosen: row[10 + i] || ''
      });
    }
    return {
      timestamp: row[0],
      score: row[1],
      total: row[2],
      percentage: row[3],
      answers: answers
    };
  });
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
