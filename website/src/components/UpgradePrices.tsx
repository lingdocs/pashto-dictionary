const prices = [
    {
        label: "$1/month",
        priceId: "price_1Lt8NqJnpCQCjf9pN7CQUjjO",
    },
    {
        label: "$10/year",
        priceId: "price_1Lt8NqJnpCQCjf9p4FAEIOMw",
    },
];
const checkoutPortalUrl = "https://account.lingdocs.com/payment/create-checkout-session/";

function UpgradePrices({ source }: { source: "account" | "wordlist" }) {
    return <div className="my-4">
        <h5>Subscription options</h5>
        <div className="d-flex flex-row flex-wrap my-3" style={{ gap: "1.5rem" }}>
            {prices.map(({ priceId, label }) => <div key={priceId}>
                <form
                    action={`${checkoutPortalUrl}?source=${source}`}
                    method="POST"
                >
                    <input type="hidden" name="priceId" value={priceId} />
                    <button className="btn btn-primary" type="submit">{label}</button>
                </form>
            </div>)}
        </div>
    </div>;
}

export default UpgradePrices;