const express = require("express");
const path = require("path");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

let db = null;

const dbPath = path.join(__dirname, "covid19India.db");
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

//GET ALL STATES API
app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT
      state_name
    FROM
      state;`;
  const statesArray = await db.all(getStateQuery);
  response.send(
    statesArray.map((eachState) => ({ stateName: eachState.state_name }))
  );
});
//get stateID api

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT
    * 
    FROM 
    state
    WHERE
    state_id = ${stateId};`;
  const state = await db.get(getStateQuery);
  response.send(convertStateDbObjectToResponseObject(state));
});

//create a district api
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrictQuery = `
    INSERT INTO
    district(district_name, state_id,cases,cured,active,deaths)
    VALUES (
        '${districtName}',
        ${stateId},
        ${cases},
        ${cured},
        ${active},
        ${deaths}
    );`;
  const districtArray = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

///get districtId api

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `SELECT
    * 
    FROM 
    district
    WHERE
    district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictDbObjectToResponseObject(district));
});

//DELETE DISTRICT ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE 
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//update the district details api
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
    district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE
    district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//RETURN THE STATS
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT 
    *
    FROM
    state
    WHERE
    state_id = ${stateId};`;
  const statesArray = await db.all(getStatsQuery);
  response.send(convertStateDbObjectToResponseObject(statesArray));
});

///state name based on district id api
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
    *
    FROM
    district
    WHERE
    district_id = ${districtId};`;
  const statesArray = await db.get(getDistrictQuery);
  response.send(convertStateDbObjectToResponseObject(statesArray));
});

module.exports = app;
