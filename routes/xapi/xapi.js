// Default
import middlewares from "../../middlewares";

// helpers
import * as apiManageer from '../../utilities/apiManager';

// Libraries
import validator from "validator";

// Constants
import contants from "../../constants";

const Controller = {

  "/xapi/auth": {
    path: "/xapi/auth",
    method: "post",
    middleware: [middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {
      let {
        Username,
        Password
      } = req.body;

      // if (!Username) {
      //   return res.status(403).json({ Confirmation: "FAIL", Message: "Username is required" });
      // }
      // if (!Password) {
      //   return res.status(403).json({ Confirmation: "FAIL", Message: "Password is required" });
      // }
      // try {
      //   const url = `${contants.LRS_HOST}/api/auth/jwt/password`;
      //   const basicAuth = 'Basic ' + btoa(Username + ':' + Password);
      //   axios
      //     .create({ headers: { 'Authorization': basicAuth } })
      //     .post(url, null)
      //     .then(response => response.data)
      //     .then((response) => {
      //       return res.json({
      //         Confirmation: "SUCCESS",
      //         Response: {
      //           Token: response
      //         }
      //       });
      //     })
      //     .catch(error => {
      //       return res.json({ Confirmation: "FAIL", Message: "DB error" });
      //     });
      // } catch (error) {
      //   return res.json({ Confirmation: "FAIL", Message: "DB error" });
      // }
    }
  },


  "/xapi/create_statement": {
    path: "/xapi/create_statement",
    method: "post",
    middleware: [middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {
      let {
        Statement
      } = req.body;

      if (!Statement) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "Statement is required" });
      }
      try {
        const url = `${contants.LRS_HOST}/data/xAPI/statements`;
        const params = Statement;
        const token = 'ZDU3MjIzMmViNTY5NDVhMTc4NmQzYTEwMjNmODdiMzhlZTNiMjJkNTo3NWI3MWE3OTcxZGY2MTNmNjgyNzdiZDE3ODc5NzhhMTQ2MTI5NWMz';
        const headers = {
          'Content-Type': 'application/json',
          'X-Experience-API-Version': '1.0.3',
          'Authorization': `Basic ${token}`
        };
        apiManageer.lrsPost(url, params, headers)
          .then(response => {
            return res.json({
              Confirmation: "SUCCESS",
              Response: {
                data: response
              }
            });
          })
          .catch(error => {
            return res.json({ Confirmation: "FAIL", Message: "DB error" });
          });
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },

};

export default Controller;
