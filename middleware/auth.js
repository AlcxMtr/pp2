// File created with help from lecture code and Grok AI
const { NextResponse } = require('next/server');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const TOKEN_EXPIRY_TIME = process.env.TOKEN_EXPIRY_TIME;
const REFRESH_EXPIRY_TIME = process.env.REFRESH_EXPIRY_TIME;
const BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS;

function hashPassword(password) {
  return bcrypt.hashSync(password, parseInt(BCRYPT_ROUNDS));
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(object) {
  return jwt.sign(object, ACCESS_TOKEN_SECRET, {
    expiresIn: TOKEN_EXPIRY_TIME,
  });
}

function generateRefreshToken(object) {
  return jwt.sign(object, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRY_TIME,
  });
}

function verifyTokenWithSecret(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Access token has expired' },
        { status: 401 }
      );
    } else if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: 'Authentication error' },
      { status: 401 }
    );
  }
}

function verifyToken(request) {
  const authorization = request.headers.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication token is required in Authorization header' },
      { status: 401 }
    );
  }
  const token = authorization.replace('Bearer ', '');
  return verifyTokenWithSecret(token, ACCESS_TOKEN_SECRET);
}

function verifyRefreshToken(request) {
  const authorization = request.headers.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Refresh token is required in Authorization header' },
      { status: 401 }
    );
  }
  const token = authorization.replace('Bearer ', '');
  return verifyTokenWithSecret(token, REFRESH_TOKEN_SECRET);
}

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
};