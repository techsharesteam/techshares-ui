import React from "react";
import {Link} from "react-router";
import Immutable from "immutable";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import TotalBalanceValue from "../Utility/TotalBalanceValue";
import SettleModal from "../Modal/SettleModal";
import MarketLink from "../Utility/MarketLink";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import CollateralPosition from "../Blockchain/CollateralPosition";
import RecentTransactions from "./RecentTransactions";
import ChainStore from "api/ChainStore";
import SettingsActions from "actions/SettingsActions";

class AccountOverview extends React.Component {

    constructor(props) {
        super();
        this.state = {
            settleAsset: "1.3.0",
            showHidden: false
        };
    }

    shouldComponentUpdate(nextProps, nextState) {

        return (
            nextProps.account !== this.props.account ||
            nextProps.settings !== this.props.settings ||
            nextProps.hiddenAssets !== this.props.hiddenAssets ||
            nextState.settleAsset !== this.state.settleAsset ||
            nextState.showHidden !== this.state.showHidden
        )
    }

    _onSettleAsset(id, e) {
        e.preventDefault();
        this.setState({
            settleAsset: id
        });

        this.refs.settlement_modal.show();
    }

    _hideAsset(asset, status) {
        SettingsActions.hideAsset(asset, status)
    }

    _renderBalances(balanceList) {
        let {settings, hiddenAssets} = this.props;
        let preferredUnit = settings.get("unit") || "1.3.0";

        let balances = [];
        balanceList.forEach( balance => {
            let balanceObject = ChainStore.getObject(balance);
            let asset_type = balanceObject.get("asset_type"); 
            let asset = ChainStore.getObject(asset_type);
            let isBitAsset = asset && asset.has("bitasset_data_id");

            const core_asset = ChainStore.getAsset("1.3.0");
            
            let assetInfoLinks = asset && <ul>
                <li><a href={`#/asset/${asset.get("symbol")}`}><Translate content="account.asset_details"/></a></li>
                {asset.get("id") !== "1.3.0" ? <li><a href={`#/market/${asset.get("symbol")}_${core_asset?core_asset.get("symbol"):"THS"}`}><Translate content="exchange.market"/></a></li> : null}
                {isBitAsset && <li><a href onClick={this._onSettleAsset.bind(this, asset.get("id"))}><Translate content="account.settle"/></a></li>}
            </ul>;

            let includeAsset = !hiddenAssets.includes(asset_type);

            balances.push(
                <tr key={balance} style={{maxWidth: "100rem", backgroundColor: !includeAsset ? "#3E3E3E" : null}}>
                    {/*isBitAsset ? <td><div onClick={this._onSettleAsset.bind(this, asset.get("id"))} className="button outline"><Translate content="account.settle" /></div></td> : <td></td>*/}
                    <td style={{textAlign: "right"}}><BalanceComponent balance={balance} assetInfo={assetInfoLinks}/></td>
                    {/*<td style={{textAlign: "right"}}><MarketLink.ObjectWrapper object={balance}></MarketLink.ObjectWrapper></td>*/}
                    <td style={{textAlign: "right"}}><BalanceValueComponent balance={balance} toAsset={preferredUnit}/></td>
                    <td style={{textAlign: "right"}}><BalanceComponent balance={balance} asPercentage={true}/></td>
                    <td style={{textAlign: "right"}}><div onClick={this._hideAsset.bind(this, asset_type, includeAsset)} className="button outline">{includeAsset ? "-" : "+"}</div></td>
                </tr>
            );
        })

        return balances;
    }

    _toggleHiddenAssets() {
        this.setState({
            showHidden: !this.state.showHidden
        })
    }

    render() {
        let {account, hiddenAssets} = this.props;
        let {showHidden} = this.state;

        if (!account) {
            return null;
        }

        let call_orders = [];
        if (account.toJS && account.has("call_orders")) call_orders = account.get("call_orders").toJS();
        let includedBalances, hiddenBalances;
        let account_balances = account.get("balances");
        let includedBalancesList = Immutable.List(), hiddenBalancesList = Immutable.List();

        if (account_balances) {
            // Filter out balance objects that have not yet been retrieved by ChainStore
            account_balances = account_balances.filter((a, key) => {
                let balanceObject = ChainStore.getObject(a);
                if (!balanceObject.get("balance")) {
                    return false;
                } else {
                    return true;
                }
            });

            // Separate balances into hidden and included
            account_balances.forEach((a, asset_type) => {
                if (hiddenAssets.includes(asset_type)) {
                    hiddenBalancesList = hiddenBalancesList.push(a);
                } else {
                    includedBalancesList = includedBalancesList.push(a);
                }
            });

            includedBalances = this._renderBalances(includedBalancesList);
            hiddenBalances = this._renderBalances(hiddenBalancesList);
        }

        if (hiddenBalances) {
            let hiddenTotal = <TotalBalanceValue balances={hiddenBalancesList} />;
            hiddenBalances.unshift(<tr><td colSpan="4"></td></tr>)
            hiddenBalances.push(
                <tr>
                    <td></td>
                    <td style={{textAlign: "right", fontWeight: "bold"}}>{hiddenTotal}</td>
                    <td colSpan="2"></td>
                </tr>
            );
        }

        let totalBalance = includedBalancesList.size ? <TotalBalanceValue balances={includedBalancesList}/> : null;

        return (
            <div className="grid-content">
                <div className="content-block small-12">
                    <h3><Translate content="transfer.balances" /></h3>
                    <table className="table">
                        <thead>
                            <tr>
                                {/*<th><Translate component="span" content="modal.settle.submit" /></th>*/}
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.asset" /></th>
                                {/*<<th style={{textAlign: "right"}}><Translate component="span" content="account.bts_market" /></th>*/}
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.eq_value" /></th>
                                <th style={{textAlign: "right"}}><Translate component="span" content="account.percent" /></th>
                                <th>{/* Hide button */}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {includedBalances}
                            {includedBalancesList.size > 1 ? <tr>
                                <td></td>
                                <td style={{textAlign: "right", fontWeight: "bold"}}>{totalBalance}</td>
                                <td colSpan="2"></td>
                            </tr> : null}
                            {showHidden ? hiddenBalances : null}
                            {hiddenBalancesList.size ? (
                                <tr>
                                    <td colSpan="4" style={{textAlign: "right"}}>
                                        <div    
                                            className="button outline"
                                            onClick={this._toggleHiddenAssets.bind(this)}
                                        >
                                            <Translate content={`account.${showHidden ? "hide_hidden" : "show_hidden"}`} /><span> ({hiddenBalances.length - 2})</span>
                                        </div>
                                    </td>
                                </tr>) : null}
                        </tbody>
                    </table>
                    <SettleModal ref="settlement_modal" asset={this.state.settleAsset} account={account.get("name")}/>
                </div>
                {call_orders.length > 0 ? <div className="content-block">
                    <h3><Translate content="account.collaterals" /></h3>
                    <table className="table">
                        <thead>
                        <tr>
                            <th><Translate content="transaction.borrow_amount" /></th>
                            <th><Translate content="transaction.collateral" /></th>
                            <th><Translate content="borrow.coll_ratio" /></th>
                            <th><Translate content="exchange.call" /></th>
                            <th><Translate content="borrow.adjust" /></th>
                            <th><Translate content="borrow.close" /></th>
                        </tr>
                        </thead>
                        <tbody>
                        { call_orders.map(id =><CollateralPosition key={id} object={id} account={account}/>) }
                        </tbody>
                    </table>
                </div> : null}
                <div className="content-block">
                    <RecentTransactions
                        accountsList={Immutable.fromJS([account.get("id")])}
                        compactView={false}
                        showMore={true}
                    />
                </div>
            </div>

        );
    }
}

export default AccountOverview;
