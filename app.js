const express = require("express");
const connectDB = require("./config/db.js");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { notFound, errorHandler } = require("./middleware/errorMiddleware.js");

// ****************** Routes ***********************
const { userRoutes } = require("./routes/userRoutes.js");
const { adminRoutes } = require("./routes/adminRoutes.js");
const { companyDetails } = require("./routes/companydetailsRoutes.js");
const { faqRoutes } = require("./routes/faqRoutes.js");
const { workCategoryRoutes } = require("./routes/workCatergoryRoutes.js");
const { workSubCategoryRoutes } = require("./routes/workSubCategoryRoutes.js");
const { platformFeeRoutes } = require("./routes/platformFeeRoutes.js");
const { directHireRoutes } = require("./routes/directHireRoutes.js");
// end 

connectDB();
const app = express();
app.use(cookieParser());
const __dirname1 = path.resolve();
app.use(express.static(path.join(__dirname1, "")));
app.use("/public", express.static("public"));
app.use("/uploads", express.static("uploads"));
app.use(express.json());

const corsOptions = {
	origin: (origin, callback) => {
		callback(null, true);
	},
  };
  
  app.use(cors(corsOptions));


  //***********************  Define Routes************************* */
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", workCategoryRoutes);
app.use("/api", workSubCategoryRoutes);
app.use("/api/CompanyDetails", companyDetails);
app.use("/api", faqRoutes);
app.use("/api", platformFeeRoutes);
app.use("/api/direct-order", directHireRoutes);


    // --------------------------deploymentssssss------------------------------

if (process.env.NODE_ENV == "production") {
	app.use(express.static(path.join(__dirname1, "/view")));
  
	app.get("*", (req, res) => res.sendFile(path.resolve(__dirname1, "view", "index.html")));
  } else {
	app.get("/", (req, res) => {
	  res.send("API is running..");
	});
  }

   // --------------------------deployment------------------------------
  
  // Error handling middleware
  app.use((err, req, res, next) => {
	const statusCode = err.statusCode || 500;
	res.status(statusCode).json({
	  message: err.message || "Internal Server Error",
	  status: false,
	});
  });
  
  // Error Handling middlewares
  app.use(notFound);
  app.use(errorHandler);
  app.use(bodyParser.json({ limit: "100mb" }));
  app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
  
  const PORT = process.env.PORT;
  const BASE_URL = process.env.BASE_URL;
  
  const server = app.listen(PORT, () => {
	console.log(`Server running on PORT ${PORT}...`);
	console.log(`Base URL: ${BASE_URL}`);
  });
 
