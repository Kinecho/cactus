"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SubscriptionRequest = /** @class */ (function () {
    function SubscriptionRequest(email) {
        this.email = email;
    }
    SubscriptionRequest.prototype.getEmail = function () {
        return this.email;
    };
    SubscriptionRequest.prototype.getFirstName = function () {
        return this.lastName;
    };
    SubscriptionRequest.prototype.getLastName = function () {
        return this.lastName;
    };
    SubscriptionRequest.prototype.getReferredByEmail = function () {
        return this.referredByEmail;
    };
    SubscriptionRequest.fromData = function (body) {
        var data = body.data || body || {};
        var email = data.email, referredByEmail = data.referredByEmail, firstName = data.firstName, lastName = data.lastName;
        var subscription = new SubscriptionRequest(email);
        subscription.referredByEmail = referredByEmail;
        subscription.firstName = firstName;
        subscription.lastName = lastName;
        return subscription;
    };
    return SubscriptionRequest;
}());
exports.default = SubscriptionRequest;
//# sourceMappingURL=SubscriptionRequest.js.map