import jwt from 'jsonwebtoken';
import cry_pto from 'crypto';

import config from '../config';

export default {
    TOKEN_SECRET: config.secret,
    setToken(id) {
        return jwt.sign(
            {
                id: id
            },
            this.TOKEN_SECRET,
            {
                expiresIn: 60 * 60
            }
        );
    },
    setMd5(value) {
        return cry_pto.createHash('md5').update(value).digest('hex');
    }
};