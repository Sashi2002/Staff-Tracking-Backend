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
    const { ID, NAME, PLANT } = req.body;
    const response = await connection
      .promise()
      .query(
        `INSERT INTO employee_master (ID, NAME, PLANT) VALUES ('${ID}', '${NAME}','${PLANT}')`
      );

    return res.status(201).json({ message: "Employee Created" });
  } catch (error) {
    console.log(error);
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
