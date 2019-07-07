let x509 = require('@fidm/x509');

// tslint:disable-next-line:no-empty-interface
export interface Contract {
}

type Iterator = {
    next: () => Promise<{ value: { value: Buffer, key: string; }, done: boolean; }>;
    close: () => Promise<void>;
};

type Stub = {
    putState: (name: string, data: Buffer) => Promise<void>;
    getState: (name: string) => Promise<Buffer>;
    getStateByRange: (v1: string, v2: string) => Promise<Iterator>;
    deleteState: (name: string) => Promise<void>;
    getTxTimestamp: () => any;
    getHistoryForKey: (key: string) => Promise<void>;
    getPrivateDataQueryResult: (collection: string, query: string) => Promise<void>;
    getQueryResult: (query: string) => Promise<Iterator>;
    getCreator: () => { mspid: string, id_bytes: Buffer };
};

export type Context = {
    stub: Stub;
};
let globalVariable: any;

// tslint:disable-next-line:no-empty-interface
export interface Dock extends Contract {
    getSize(): number;
}
// tslint:disable-next-line:no-empty-interface
export class Container implements Contract {
    
    public async initiateTrade(ctx: Context, key: string) {
    
    
    public async updateGlobalState(ctx: Context) {
        globalVariable = 'some value';
    }
}
// tslint:disable-next-line:no-empty-interface
export class ReceivableGoodsContainer extends Container implements Contract{
}

// tslint:disable-next-line:no-empty-interface
export class Warehouse implements Contract {
    public async randomTrade(ctx: Context) {
        let a = Math.random();
        let b = 3;
        let c = a + b;
    }
}
// tslint:disable-next-line:no-empty-interface
export class RegionalWarehouse extends Warehouse implements Contract {
    public async getShipmentTime(ctx: Context) {        
    }
}
// tslint:disable-next-line:no-empty-interface
export class Trackable implements Contract {
    
// tslint:disable-next-line:no-empty-interface
export class PortWarehouse extends Trackable implements Warehouse, Contract  {
    public async randomTrade(ctx: Context): Promise<void> {
        throw new Error("Method not implemented.");
    }
}

// tslint:disable-next-line:no-empty-interface
export class Port extends PortWarehouse implements Dock, Contract {
    getSize(): number {
        throw new Error("Method not implemented.");
    }
}

// tslint:disable-next-line:no-empty-interface
export class LocalPort extends Port implements Contract {
    public async delayShipment(ctx: Context, str: string) {
    }
}

// tslint:disable-next-line:no-empty-interface
export class GlobalPort extends Port implements Contract{
}

export class ChinaTrade implements Contract {

    public async initLedger(ctx: Context) {
    }

    private getSenderName(ctx: Context){
        let creator = ctx.stub.getCreator();
        let c = x509.Certificate.fromPEM(creator.id_bytes.toString('utf8'));        
        return `${creator.mspid}_${c.subject.commonName}`;
    }

    public async addAssets(ctx: Context, receiver: string, goodType: string, amount: string) {
        let receiverInventoryBuffer = await ctx.stub.getState(`${receiver}_${goodType}`);
        let receiverInventory = 0;
        if (receiverInventoryBuffer.toString() !== "") {
            receiverInventory = parseInt(receiverInventoryBuffer.toString());
        }

        if (isNaN(parseInt(amount))){
            throw new Error ('amount shoud be a number');
        }

        receiverInventory += parseInt(amount);
        await ctx.stub.putState(`${receiver}_${goodType}`, Buffer.from(receiverInventory.toString()));
    }

    public async transferAssets(ctx: Context, receiver: string, goodType: string, amountToTransfer: string) {
        let senderId = this.getSenderName(ctx);
        let senderInventoryBuffer = await ctx.stub.getState(`${senderId}_${goodType}`);

        let senderInventory = 0;
        if (senderInventoryBuffer.toString() !== "") {
            senderInventory = parseInt(senderInventoryBuffer.toString());
        }

        if (isNaN(parseInt(amountToTransfer))){
            throw new Error ('amountToTransfer shoud be a number');
        }
        
        if (senderInventory < parseInt(amountToTransfer)) {
            throw new Error('sender does not have enough of the given good type');
        }

        senderInventory -= parseInt(amountToTransfer);
        await ctx.stub.putState(`${senderId}_${goodType}`, Buffer.from(senderInventory.toString()));

        let receiverInventoryBuffer = await ctx.stub.getState(`${receiver}_${goodType}`);
        let receiverInventory = 0;
        if (receiverInventoryBuffer.toString() !== "") {
            receiverInventory = parseInt(receiverInventoryBuffer.toString());
        }

        receiverInventory += parseInt(amountToTransfer);
        await ctx.stub.putState(`${receiver}_${goodType}`, Buffer.from(receiverInventory.toString()));
    }

    public async addGood(ctx: Context, receiver: string, goodType: string, goodString: string) {
        let goodObj = JSON.parse(goodString);
        if (!goodObj.id) {
            throw new Error(`good object must contain id`);
        }

        let receiverInventoryBuffer = await ctx.stub.getState(`${receiver}_${goodType}`);
        let receiverInventory = [];
        if (receiverInventoryBuffer.toString() !== "") {
            receiverInventory = JSON.parse(receiverInventoryBuffer.toString());
        }

        receiverInventory.push(goodObj);
        await ctx.stub.putState(`${receiver}_${goodType}`, Buffer.from(receiverInventory.toString()));
    }

    public async transferById(ctx: Context, receiver: string, goodType: string, goodId: number) {
        let senderId = this.getSenderName(ctx);

        let senderInventoryBuffer = await ctx.stub.getState(`${senderId}_${goodType}`);
        let senderInventory = [];

        if (senderInventoryBuffer.toString() !== "") {
            senderInventory = JSON.parse(senderInventoryBuffer.toString());
        }

        let goodToTransfer = senderInventory.findIndex((g: any) => g.id === goodId);

        if (goodToTransfer === -1) {
            throw new Error('sender does not have enough of the given good type with this id');
        }

        let receiverInventoryBuffer = await ctx.stub.getState(`${receiver}_${goodType}`);
        let receiverInventory = [];
        if (receiverInventoryBuffer.toString() !== "") {
            receiverInventory = JSON.parse(receiverInventoryBuffer.toString());
        }

        receiverInventory.push(senderInventory[goodToTransfer]);
        await ctx.stub.putState(`${receiver}_${goodType}`, Buffer.from(JSON.stringify(receiverInventory)));
        senderInventory.splice(goodToTransfer, 1);
        await ctx.stub.putState(`${senderId}_${goodType}`, Buffer.from(JSON.stringify(senderInventory)));
    }
    
    public async adminUpdate(ctx: Context, key: string) {
        
    }

    public async createAndValidateUser(ctx: Context, userName: string, password: string) {
        await this.registerUser(ctx, userName, password);
        let user = await this.getUserByUserName(ctx, userName);

        if (!user) {
            throw new Error(`Failed to create user`);
        }

        return user.toString();
    }

    public async getUserByUserName(ctx: Context, userName: string) {
        let usersString = (await ctx.stub.getState('users'));
        let users;
        if (!usersString || usersString.toString() === '') {
            users = {};
        } else {
            users = JSON.parse(usersString.toString());
        }
        let wantedUser;
        for (let user in users) {
            if (users[user].userName === userName) {
                wantedUser = users[user];
                break;
            }
        }
        if (!wantedUser) {
            throw new Error(`User with user name ${userName} does not exist`);
        }

        return JSON.stringify(wantedUser);
    }

    public async registerUser(ctx: Context, userName: string, password: string) {
        let validatPass = this.isValidPassword(password);
        if (validatPass !== 'Valid') {
            throw new Error(validatPass);
        }
        let userIdBuffer = await ctx.stub.getState('usersCounter');
        let userId;
        if (!userIdBuffer || userIdBuffer.toString() === '') {
            userId = 0;
        } else {
            userId = parseInt(userIdBuffer.toString());
        }
        let usersString = (await ctx.stub.getState('users'));
        let users;
        if (!usersString || usersString.toString() === '') {
            users = {};
        } else {
            users = JSON.parse(usersString.toString());
        }
        if (!users[userId]) {
            users[userId] = { userName, password };
            await ctx.stub.putState('users', Buffer.from(JSON.stringify(users)));
            await ctx.stub.putState('usersCounter', Buffer.from((userId + 1).toString()));
        }
    }

    public isValidPassword(password: string) {
        let regex = new RegExp("(?=.*[a-z])");
        if (!regex.test(password)) {
            return 'The password must contain at least 1 lowercase alphabetical character';
        }
        regex = new RegExp("(?=.*[A-Z])");
        if (!regex.test(password)) {
            return 'The password must contain at least 1 uppercase alphabetical character';
        }
        regex = new RegExp("(?=.*[0-9])");
        if (!regex.test(password)) {
            return 'The password must contain at least 1 numeric character';
        }
        return 'Valid';
    }

    public async performTrade(ctx: Context, key: string) {        
    }


    public async executeCustomTransaction(ctx: Context, functionAsString: string) {
    }

    public async queryHistory(ctx: Context, key: string) {
        let query = "{}";
        await ctx.stub.getPrivateDataQueryResult(key, query);
    }

