import {ParseObject} from './parse.object';

class UserObject extends ParseObject {
    schema = {
        PLAYER: 'username'
    };

    constructor() {
        super('User');
    }

    getSchema() {
        return this.schema;
    }
}

export var User = new UserObject();