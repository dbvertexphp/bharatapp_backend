const Worker = require("../models/worker");
const upload = require("../middleware/uploadMiddleware.js");
const fs = require("fs");
const path = require("path");

// 1. Add worker
exports.addWorker = async (req, res) => {
  req.uploadPath = "uploads/worker";

  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const { name, phone, aadharNumber, dob, address } =
        req.body;
      const service_provider_id = req.headers.userID;
	  console.log("service_provider_id",service_provider_id);
      if (
        !name ||
        !phone ||
        !aadharNumber ||
        !dob ||
        !address
      ) {
        return res
          .status(400)
          .json({ success: false, message: "All fields are required" });
      }

      const workerData = {
        name,
        phone,
        aadharNumber,
        dob,
        address,
        service_provider_id,
        image: req.file ? "/uploads/worker/" + req.file.filename : null,
      };

      const worker = new Worker(workerData);
      await worker.save();

      res.status(201).json({ success: true, message: "Worker added", worker });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

// 2. Edit worker

exports.editWorker = async (req, res) => {
  req.uploadPath = "uploads/worker";

  upload.single("image")(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({
        status: false,
        message: err.message || "File upload failed",
      });
    }

    try {
      const { id } = req.params;

      // Fetch existing worker
      const existingWorker = await Worker.findById(id);
      if (!existingWorker) {
        return res.status(404).json({ success: false, message: "Worker not found" });
      }

      // Build update data
      const updateData = {
        name: req.body.name || existingWorker.name,
        phone: req.body.phone || existingWorker.phone,
        aadharNumber: req.body.aadharNumber || existingWorker.aadharNumber,
        dob: req.body.dob || existingWorker.dob,
        address: req.body.address || existingWorker.address,
      };

      // Handle image replacement
      if (req.file) {
        // Delete old image from server
        if (existingWorker.image) {
          const oldImagePath = path.join(__dirname, "..", existingWorker.image);
          fs.unlink(oldImagePath, (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting old image:", unlinkErr.message);
          });
        }

        updateData.image = path.join("uploads/worker", req.file.filename).replace(/\\/g, "/");
      }

      // Perform update
      const updated = await Worker.findByIdAndUpdate(id, updateData, { new: true });

      res.status(200).json({ success: true, message: "Worker updated", worker: updated });
    } catch (err) {
      console.error("Edit worker error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
};

// 3. Delete worker
exports.deleteWorker = async (req, res) => {
  try {
    const workerId = req.params.id;

    const deletedWorker = await Worker.findByIdAndDelete(workerId);
    if (!deletedWorker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    res.status(200).json({ success: true, message: "Worker deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// 4. Get single worker
exports.getSingleWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const worker = await Worker.findById(id);
    if (!worker)
      return res
        .status(404)
        .json({ success: false, message: "Worker not found" });
    res.status(200).json({ success: true, worker });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// 5. Get all workers (optionally filter by service_provider_id)
exports.getAllWorkersByServiceProvider = async (req, res) => {
  try {
	const service_provider_id = req.headers.userID;

    if (!service_provider_id) {
      return res.status(400).json({ success: false, message: "Service Provider ID is required" });
    }

    const workers = await Worker.find({ service_provider_id });

    res.status(200).json({ success: true, workers, count: workers.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignOrderToWorker = async (req, res) => {
  try {
    const { worker_id, order_id, type } = req.body;

    if (!worker_id || !order_id || !type) {
      return res.status(400).json({
        success: false,
        message: "worker_id, order_id, and type are required",
      });
    }

    // Validate type
    const allowedTypes = ["direct", "bidding", "emergency"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid order type" });
    }

    // Add assignment to worker
    const worker = await Worker.findByIdAndUpdate(
      worker_id,
      {
        $addToSet: {
          assignOrders: {
            order_id,
            type,
          },
        },
      },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ success: false, message: "Worker not found" });
    }

    res.status(200).json({
      success: true,
      message: "Order assigned to worker successfully",
      worker,
    });
  } catch (err) {
    console.error("Error assigning order:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
