import middlewares from "../../../middlewares";
import * as helpers from "../../../utilities/helpers";

const Controller = {
  "/root/test": {
    path: "/root/test",
    method: "post",
    middleware: null,
    controller: (req, res, next) => {
      res.json({
        pass: "here"
      });
    }
  },

  "/root/test2": {
    path: "/root/test2",
    method: "post",
    middleware: null,
    controller: (req, res, next) => {
      let link = "http://waithook.com/testing_879";
      helpers.generateQRCode(link, "123").then(() => {
        res.json({
          res: "ok"
        });
      });
    }
  }
};

export default Controller;
