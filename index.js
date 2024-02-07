const express = require("express");
const path = require("path");
const connection = require("./utils/database");
const app = express();

app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(reqLogger);
app.use(express.static(path.join(__dirname)));

function reqLogger(req, res, next) {
  console.log(`${req.method}: ${req.url}`);
  next();
}

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/views/employee", (req, res) => {
  res.render("employee");
});

app.post("/api/employee", async (req, res) => {
  try {
    let employees = req.body;

    // If the request body is a single object, convert it to an array
    if (!Array.isArray(employees)) {
      employees = [employees];
    }

    // Check if employees is not an empty array
    if (employees.length === 0) {
      return res
        .status(400)
        .json({
          message:
            "Invalid request body. Expecting at least one employee object.",
        });
    }

    // Assuming employees is an array of objects with properties ID, NAME, and PLANT
    const values = employees
      .map(({ ID, NAME, PLANT }) => `('${ID}', '${NAME}', '${PLANT}')`)
      .join(",");

    const response = await connection
      .promise()
      .query(`INSERT INTO employee_master (ID, NAME, PLANT) VALUES ${values}`);

    return res.status(201).json({ message: "Employees Created" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/employee", async (req, res) => {
  try {
    const [rows] = await connection
      .promise()
      .query("SELECT * FROM employee_master");

    return res
      .status(200)
      .json({ message: "All Employee Fetched", students: rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/employee/:ID", async (req, res) => {
  try {
    const { ID } = req.params;
    const [rows] = await connection
      .promise()
      .query(`SELECT * FROM employee_master WHERE ID='${ID}'`);
    if (rows.length > 0 && rows[0]) {
      return res.render("employee", { ...rows[0] });
    } else {
      return res
        .status(404)
        .json({ message: "Employee with given ID does not exit" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/employee/swipe/:ID", async (req, res) => {
  try {
    const { ID } = req.params;

    // Fetch employee data from the master table
    const employeeQuery = `SELECT ID, PLANT FROM employee_master WHERE ID='${ID}'`;
    const [employeeData] = await connection.promise().query(employeeQuery);

    if (employeeData.length === 0) {
      return res
        .status(404)
        .json({ message: "Employee with given ID not found" });
    }

    const employeeID = employeeData[0].ID;

    // Get the current date, month, and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Adjusting for zero-based months
    const currentYear = currentDate.getFullYear();

    // Format the current time as HH:mm:ss
    const currentTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;

    // Create a table name based on the current month and year
    const tableName = `swipe_${currentYear}-${String(currentMonth).padStart(
      2,
      "0"
    )}`;
    // const tableName = `swipe_${currentMonth}_${currentYear}`;

    // Use employee ID as SWIPEID
    const swipeData = {
      SWIPEID: employeeID,
      VARMONTH: `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}-${currentDate.getDate()}`,
      VARDATE: `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}-${currentDate.getDate()}`, // Format as 'YYYY-MM-DD'
      VARTIME: currentTime,
      VARTYPE: "OUT",
      MACHINE_CODE: 123,
    };

    // Check if the table already exists
    const tableExistsQuery = `SHOW TABLES LIKE '${tableName}'`;
    const [existingTables] = await connection.promise().query(tableExistsQuery);

    if (existingTables.length === 0) {
      // Table doesn't exist, create it
      const createTableQuery = `
        CREATE TABLE \`${tableName}\` (
          SWIPEID INT NOT NULL,
          VARMONTH DATE NOT NULL,
          VARDATE DATE NOT NULL,
          VARTIME VARCHAR(8) NOT NULL,
          VARTYPE VARCHAR(8) NOT NULL,
          MACHINE_CODE INT
        )`;

      // Execute the query to create a new table
      await connection.promise().query(createTableQuery);
    }

    // Insert swipe data into the table
    const insertSwipeQuery = `
      INSERT INTO \`${tableName}\` (SWIPEID, VARMONTH, VARDATE, VARTIME, VARTYPE, MACHINE_CODE)
      VALUES (?, ?, ?, ?, ?, ?)`;

    await connection
      .promise()
      .query(insertSwipeQuery, [
        swipeData.SWIPEID,
        swipeData.VARMONTH,
        swipeData.VARDATE,
        swipeData.VARTIME,
        swipeData.VARTYPE,
        swipeData.MACHINE_CODE,
      ]);

    res.status(200).json({ message: `Swipe data added to table ${tableName}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// app.get("/api/employee/swipe/:ID", async (req, res) => {
//   try {
//     const { ID } = req.params;

//     // Fetch employee data from the master table
//     const employeeQuery = `SELECT ID, PLANT FROM employee_master WHERE ID='${ID}'`;
//     const [employeeData] = await connection.promise().query(employeeQuery);

//     if (employeeData.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "Employee with given ID not found" });
//     }

//     const employeeID = employeeData[0].ID;
//     const plantID = employeeData[0].PLANT;

//     // Get the current date, month, and year
//     const currentDate = new Date();
//     const currentMonth = currentDate.getMonth() + 1; // Months are zero-based
//     const currentYear = currentDate.getFullYear();

//     // Format the current time as HH:mm:ss
//     const currentTime = `${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;

//     // Create a table name based on the current month and year
//     const tableName = `swipe_${currentMonth}_${currentYear}`;

//     // Check if the table already exists
//     const tableExistsQuery = `SHOW TABLES LIKE '${tableName}'`;
//     const [existingTables] = await connection.promise().query(tableExistsQuery);

//     if (existingTables.length === 0) {
//       // Table doesn't exist, create it
//       const createTableQuery = `
//         CREATE TABLE ${tableName} (
//           SWIPEID INT NOT NULL,
//           PLANT_ID VARCHAR(4) NOT NULL,
//           VARMONTH DATE NOT NULL,
//           VARDATE DATE NOT NULL,
//           VARTIME VARCHAR(8) NOT NULL,
//           VARTYPE VARCHAR(8) NOT NULL, -- Change the length based on your actual data
//           MACHINE_CODE INT
//         )`;

//       // Execute the query to create a new table
//       await connection.promise().query(createTableQuery);
//     }

//     // Use employee ID as SWIPEID
//     const swipeData = {
//       // From Table 2 [Machine data table] -->
//       SWIPEID: employeeID,
//       PLANT_ID: plantID, //From Table 1 [master table]
//       VARMONTH: currentDate,
//       VARDATE: currentDate, // Fix: Use currentDate for VARDATE --> Both date and month same
//       VARTIME: currentTime,
//       VARTYPE: "IN",
//       MACHINE_CODE: 123,
//     };

//     // Insert swipe data into the table
//     const insertSwipeQuery = `
//       INSERT INTO ${tableName} (SWIPEID, PLANT_ID, VARMONTH, VARDATE, VARTIME, VARTYPE, MACHINE_CODE)
//       VALUES (?, ?, ?, ?, ?, ?, ?)`;

//     await connection
//       .promise()
//       .query(insertSwipeQuery, [
//         swipeData.SWIPEID,
//         swipeData.PLANT_ID,
//         swipeData.VARMONTH,
//         swipeData.VARDATE,
//         swipeData.VARTIME,
//         swipeData.VARTYPE,
//         swipeData.MACHINE_CODE,
//       ]);

//     res.status(200).json({ message: `Swipe data added to table ${tableName}` });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// });

app.get("/api/employee/attendance/:ID", async (req, res) => {
  try {
    const { ID } = req.params;

    // Fetch employee data from the master table
    const employeeQuery = `SELECT ID, PLANT FROM employee_master WHERE ID='${ID}'`;
    const [employeeData] = await connection.promise().query(employeeQuery);

    if (employeeData.length === 0) {
      return res
        .status(404)
        .json({ message: "Employee with given ID not found" });
    }

    const employeeID = employeeData[0].ID;
    const plantID = employeeData[0].PLANT;

    // Fetch swipe data from the swipe table
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // Adjusting for zero-based months
    const currentYear = currentDate.getFullYear();

    const swipeTableName = `swipe_${currentYear}-${String(
      currentMonth
    ).padStart(2, "0")}`;

    const employeeInfoQuery = `
      SELECT SWIPEID, VARMONTH, VARDATE, VARTIME, VARTYPE, MACHINE_CODE
      FROM \`${swipeTableName}\`
      WHERE SWIPEID = '${employeeID}'`;

    const [employeeInfo] = await connection.promise().query(employeeInfoQuery);

    if (employeeInfo.length === 0) {
      return res
        .status(404)
        .json({ message: "Swipe data for the employee not found" });
    }

    // Use a fixed table name for attendance
    const attendanceTableName = "attendance";

    // Check if the attendance table already exists
    const attendanceTableExistsQuery = `SHOW TABLES LIKE '${attendanceTableName}'`;
    const [attendanceTableExists] = await connection
      .promise()
      .query(attendanceTableExistsQuery);

    if (attendanceTableExists.length === 0) {
      // Attendance table doesn't exist, create it
      const createAttendanceTableQuery = `
        CREATE TABLE \`${attendanceTableName}\` (
          SWIPEID INT NOT NULL,
          PLANT_ID VARCHAR(4) NOT NULL,
          VARMONTH DATE NOT NULL,
          VARDATE DATE NOT NULL,
          VARTIME VARCHAR(8) NOT NULL,
          VARTYPE VARCHAR(8) NOT NULL,
          MACHINE_CODE INT
        )`;

      // Execute the query to create a new attendance table
      await connection.promise().query(createAttendanceTableQuery);
    }

    // Insert attendance data into the table
    const insertAttendanceQuery = `
      INSERT INTO \`${attendanceTableName}\` (SWIPEID, PLANT_ID, VARMONTH, VARDATE, VARTIME, VARTYPE, MACHINE_CODE)
      VALUES (?, ?, ?, ?, ?, ?, ?)`;

    // Assuming employeeInfo is an array of objects with the required fields
    for (const data of employeeInfo) {
      await connection
        .promise()
        .query(insertAttendanceQuery, [
          data.SWIPEID,
          plantID,
          data.VARMONTH,
          data.VARDATE,
          data.VARTIME,
          data.VARTYPE,
          data.MACHINE_CODE,
        ]);
    }

    res.status(200).json({
      message: `Attendance data added to table ${attendanceTableName}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.patch("/api/employee/:ID/NAME", async (req, res) => {
  try {
    const { ID } = req.params;
    const { NAME } = req.body;
    const response = await connection
      .promise()
      .query(`UPDATE employee_master SET NAME='${NAME}' WHERE ID='${ID}'`);
    console.log(response);
    return res.status(200).json({ message: "Employee Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.delete("/api/employee/:ID", async (req, res) => {
  try {
    const { ID } = req.params;
    const response = await connection
      .promise()
      .query(`DELETE FROM employee_master WHERE ID='${ID}'`);
    return res.json({ message: "Employee Deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

connection
  .promise()
  .connect()
  .then(() => {
    console.log("✅ connected to database.");
    app.listen(5000, () => {
      console.log("✅ server is starting at http://localhost:5000");
    });
  })
  .catch((err) => {
    console.log("❌ unable to connect to database!");
    console.log(err);
  });
