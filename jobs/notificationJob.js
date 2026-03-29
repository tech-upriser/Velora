const cron = require("node-cron");
const User = require("../models/User");
const Trip = require("../models/trip");
const Notification = require("../models/Notification");
 
// Runs every day at 9 AM
// Notifies users who haven't created a trip in 7+ days
 
const startNotificationJob = () => {
    cron.schedule("0 9 * * *", async () => {
        try {
            console.log("[CRON] Running inactive user check...");
 
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
 
            // Find all users
            const users = await User.find({});
 
            for (const user of users) {
                // Check their most recent trip
                const latestTrip = await Trip.findOne({ userId: user._id })
                    .sort({ createdAt: -1 });
 
                const isInactive =
                    !latestTrip ||
                    latestTrip.createdAt < sevenDaysAgo;
 
                if (isInactive) {
                    // Avoid duplicate notifications — check if already sent today
                    const alreadyNotified = await Notification.findOne({
                        userId: user._id,
                        type: "inactive_reminder",
                        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                    });
 
                    if (!alreadyNotified) {
                        await Notification.create({
                            userId: user._id,
                            type: "inactive_reminder",
                            message: "You haven't planned a trip in a while — explore somewhere new!"
                        });
 
                        console.log(`[CRON] Notified inactive user: ${user.email}`);
                    }
                }
            }
 
            console.log("[CRON] Inactive user check complete.");
        } catch (err) {
            console.error("[CRON] Error:", err.message);
        }
    });
 
    console.log("[CRON] Notification job scheduled — runs daily at 9 AM");
};
 
module.exports = startNotificationJob;