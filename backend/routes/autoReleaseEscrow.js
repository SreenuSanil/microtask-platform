const cron = require("node-cron");
const Task = require("../models/Task");
const WalletTransaction = require("../models/WalletTransaction");
const User = require("../models/User");

/* =========================
   AUTO ESCROW RELEASE
========================= */

cron.schedule("0 * * * *", async () => {

  try {

    const now = new Date();

    const tasks = await Task.find({
      status: "pending_verification",
      escrowStatus: "held",
      completedAt: { $exists: true }
    });

    for (const task of tasks) {

      const hoursPassed =
        (now - task.completedAt) / (1000 * 60 * 60);

      if (hoursPassed >= 48) {

        task.status = "completed";
        task.escrowStatus = "released";
        task.verifiedAt = new Date();

        await task.save();

        const commissionRate = 0.10;

        const commission = task.budget * commissionRate;
        const workerAmount = task.budget - commission;

        /* Worker earning */

        await WalletTransaction.create({
          user: task.assignedWorker,
          relatedUser: task.provider,
          task: task._id,
          type: "worker_earning",
          amount: workerAmount,
          description: "Auto escrow release after 48 hours"
        });

        /* Platform commission */

        await WalletTransaction.create({
          user: task.provider,
          relatedUser: task.assignedWorker,
          task: task._id,
          type: "commission",
          amount: commission,
          description: "Platform commission"
        });

        /* Update worker stats */

        const worker = await User.findById(task.assignedWorker);

        worker.completedTasks += 1;

        const skill = task.requiredSkill.toLowerCase();

        let skillJob = worker.skillCompletedTasks.find(
          s => s.skill === skill
        );

        if (!skillJob) {
          worker.skillCompletedTasks.push({
            skill,
            count: 1
          });
        } else {
          skillJob.count += 1;
        }

        await worker.save();

        console.log("Auto escrow released:", task._id);

      }

    }

  } catch (err) {

    console.error("Auto escrow error:", err);

  }

});