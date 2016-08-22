import React from "react";
import {PropTypes} from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import {OrderRow, TableHeader} from "../Exchange/MyOpenOrders";
import market_utils from "common/market_utils";
import counterpart from "counterpart";
import MarketsActions from "actions/MarketsActions";
import notify from "actions/NotificationActions";
import LoadingIndicator from "../LoadingIndicator";
import ChainStore from "api/ChainStore";
import MarketLink from "../Utility/MarketLink";

class AccountOrders extends React.Component {

    _cancelLimitOrder(orderID, e) {
        e.preventDefault();

        MarketsActions.cancelLimitOrder(
            this.props.account.get("id"),
            orderID // order id to cancel
        ).catch(err => {
            console.log("cancel order error:", err);
        });
    }

    render() {
        let {assets, account} = this.props;
        let cancel = counterpart.translate("account.perm.cancel");
        let markets = {};

        let marketOrders ={};
        account.get("orders").forEach(orderID => {
            let order = ChainStore.getObject(orderID).toJS();
            let base = ChainStore.getAsset(order.sell_price.base.asset_id);
            let quote = ChainStore.getAsset(order.sell_price.quote.asset_id);
            if (base && quote) {
                let baseID = parseInt(order.sell_price.base.asset_id.split(".")[2], 10);
                let quoteID = parseInt(order.sell_price.quote.asset_id.split(".")[2], 10);

                let marketID = quoteID > baseID ? `${quote.get("symbol")}_${base.get("symbol")}` : `${base.get("symbol")}_${quote.get("symbol")}`;

                if (!markets[marketID]) {
                    if (quoteID > baseID) {
                        markets[marketID] = {
                            base: {id: base.get("id"), symbol: base.get("symbol"), precision: base.get("precision")},
                            quote: {id: quote.get("id"), symbol: quote.get("symbol"), precision: quote.get("precision")}
                        };
                    } else {
                        markets[marketID] = {
                            base: {id: quote.get("id"), symbol: quote.get("symbol"), precision: quote.get("precision")},
                            quote: {id: base.get("id"), symbol: base.get("symbol"), precision: base.get("precision")}
                        };
                    }
                }

                let marketBase = ChainStore.getAsset(markets[marketID].base.id);
                let marketQuote = ChainStore.getAsset(markets[marketID].quote.id);

                if (!marketOrders[marketID]) {
                    marketOrders[marketID] = [];
                }
                marketOrders[marketID].push(
                    <OrderRow
                        ref={markets[marketID].base.symbol}
                        key={order.id}
                        order={order}
                        base={marketBase}
                        quote={marketQuote}
                        cancel_text={cancel}
                        showSymbols={false}
                        invert={true}
                        onCancel={this._cancelLimitOrder.bind(this, order.id)}
                    />
                );
            }
        });

        let tables = [];

        let marketIndex = 0;
        for (let market in marketOrders) {
            if (marketOrders[market].length) {
                tables.push(
                    <div key={market} style={marketIndex > 0 ? {paddingTop: "1rem"} : {}}>
                    <h5><MarketLink quote={markets[market].quote.id} base={markets[market].base.id} /></h5>
                    <table className="table table-striped text-right ">
                        <TableHeader baseSymbol={markets[market].base.symbol} quoteSymbol={markets[market].quote.symbol}/>
                        <tbody>
                            {marketOrders[market]}
                        </tbody>
                    </table>
                    </div>
                );
                marketIndex++;
            }
        }

        return (
            <div className="grid-block">
                <div className="grid-content small-12">
                    {!tables.length ? <div style={{fontSize: "2rem"}}><Translate content="account.no_orders" /></div> : null}
                    {tables}
                </div>

            </div>
        );
    }
}

export default AccountOrders;
