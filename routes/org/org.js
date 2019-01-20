// Default
import middlewares from "../../middlewares";

// services
import OrgService from '../../services/OrgService';

const Controller = {

  "/org/login": {
    path: "/org/login",
    method: "get",
    middleware: [middlewares.keycloakProtect, middlewares.logResponseBody],
    controller: (req, res, next) => {

      const keycloakToken = JSON.parse(req.session['keycloak-token']);
      const {
        access_token,
        refresh_token
      } = keycloakToken;
      return res.json({
        Confirmation: 'SUCCESS',
        Response: {
          AccessToken: access_token,
          RefreshToken: refresh_token,
        }
      })
    }
  },


  "/org/route": {
    path: "/org/route",
    method: "post",
    middleware: [middlewares.apiKey, middlewares.logResponseBody],
    controller: async (req, res, next) => {

      let {
        OrgUrl
      } = req.body;

      if (!OrgUrl) {
        return res.status(403).json({ Confirmation: "FAIL", Message: "OrgUrl is required" });
      }

      try {

        OrgUrl = OrgUrl.trim();
        const response = await OrgService.orgList({ OrgUrl, IsActive: 1 });

        if (!response.length
          || response.length > 1) {
          return res.json({ Confirmation: "FAIL", Message: "Org not found" });
        } else {
          const {
            Realm
          } = response[0];
          return res.json({
            Confirmation: "SUCCESS",
            Response: {
              Org: {
                Realm
              }
            }
          })
        }
      } catch (error) {
        return res.json({ Confirmation: "FAIL", Message: "DB error" });
      }
    }
  },


};

export default Controller;