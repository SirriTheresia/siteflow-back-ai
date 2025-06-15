class StripeService {
  static async getCheckoutUrl(user, workspace) {
    // Static Stripe checkout link - user must use same email as account
    const checkoutUrl = "https://buy.stripe.com/dRmdR891Tgok0ZubPs7wA0d";
    
    console.log(`Directing user ${user.email} to Stripe checkout for workspace ${workspace.name}`);
    console.log(`Important: User must use email ${user.email} in Stripe checkout`);
    
    return checkoutUrl;
  }
}

module.exports = StripeService; 