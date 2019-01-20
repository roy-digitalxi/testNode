import cron from "cron";
import schedule from "node-schedule";

export const invoiceCron = io => {
  return new cron.CronJob({
    cronTime: "*/30 * * * * *",
    onTick: () => {
      console.log("cron task here");
    },
    start: false,
    timeZone: "America/Toronto"
  });
};

schedule.scheduleJob("0 0 5 * * *", () => {
  console.log("timer");
});
