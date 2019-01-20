import bcrypt from "bcryptjs";

export const hashPassword = password => {
  return bcrypt.hashSync(password, 10);
};

export const randomPassword = () => {
  return Math.floor(Math.random() * 900000) + 100000;
}