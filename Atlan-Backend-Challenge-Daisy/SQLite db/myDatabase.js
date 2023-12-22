const sqlite3 = require("sqlite3").verbose();

//execute the callback with the retrieved data or an error
function fetchRecordsFromDatabase(callback) {
  const db = new sqlite3.Database('students2.db');

  const query = "SELECT * FROM students";

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Error querying database:", err);
      callback(err, null);
      //The callback function receives err (an error object) and rows (an array of fetched rows).
      db.close();
      return;
    }

    //if success
    callback(null, rows);
    //The callback function receives err (an error object) and rows (an array of fetched rows).
    db.close();
  });
}

module.exports = { fetchRecordsFromDatabase };
