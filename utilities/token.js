import jwt from "jsonwebtoken";
import constants from "../constants";

export const createToken = UserGUID => {
  return jwt.sign({ UserGUID: UserGUID }, constants.JWT_SECRET, {
    expiresIn: 3600
  });
};
