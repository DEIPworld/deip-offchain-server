import VerificationToken from './../schemas/verificationToken';
import CryptoJS from 'crypto-js';

async function findVerificationToken(token) {
  const tkn = await VerificationToken.findOne({ token });
  return tkn;
}

async function removeVerificationToken(token) {
  const tkn = await VerificationToken.deleteOne({ token });
  return tkn;
}

async function createVerificationToken(creator, token) {
  let hex = CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex);
  const tkn = new VerificationToken({
    email: token.email,
    firstName: token.firstName,
    lastName: token.lastName,
    token: hex,
    expirationTime: token.expirationTime,
    creator: creator
  });
  const savedToken = await tkn.save();
  return savedToken;
}


export {
  findVerificationToken,
  createVerificationToken,
  removeVerificationToken
}