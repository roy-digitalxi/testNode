import fs from "fs";
import path from "path";
import { Router } from "express";
const router = new Router();

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    filelist = fs.statSync(path.join(dir, file)).isDirectory()
      ? walkSync(path.join(dir, file), filelist)
      : filelist.concat(path.join(dir, file));
  });
  return filelist;
};

let files = walkSync("./routes", []);
let controllers = [];

files.map(path => {
  controllers.push(require("./" + path));
});

controllers.map(Ctrl => {
  let value = Object.values(Ctrl);
  for (const key of Object.keys(value[0])) {
    const route = value[0][key];
    if (route && route.path && route.method) {
      switch (route.method) {
        case "get":
          router.get(route.path, route.middleware || [], route.controller);
          break;
        case "post":
          router.post(route.path, route.middleware || [], route.controller);
          break;
        default:
          router.get(route.path, route.middleware || [], route.controller);
      }
    }
  }
});

export default router;
