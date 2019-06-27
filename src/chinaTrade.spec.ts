import { should } from 'chai';
import { ChinaTrade } from './chinaTrade';

should();

describe('China Trade', function() {

    it('Should check valid password', async function() {
        let chinaTrade = new ChinaTrade();
        let passwordRes = chinaTrade.isValidPassword('1aA');
        passwordRes.should.equal('Valid');
    });
});