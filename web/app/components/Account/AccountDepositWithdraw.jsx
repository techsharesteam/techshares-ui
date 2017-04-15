import config from "chain/config";
import React from "react";
import {Link} from "react-router";
import Translate from "react-translate-component";
import ChainStore from "api/ChainStore";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import WalletDb from "stores/WalletDb";
import WithdrawModal from "../Modal/WithdrawModal";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../Account/AccountBalance";
import WithdrawModalMetaexchange from "../Modal/WithdrawModalMetaexchange";
import DepositModalMetaexchange from "../Modal/DepositModalMetaexchange";
import TranswiserDepositWithdraw from "./transwiser/TranswiserDepositWithdraw";
import BlockTradesBridgeDepositRequest from "./blocktrades/BlockTradesBridgeDepositRequest";
import BlockTradesGatewayDepositRequest from "./blocktrades/BlockTradesGatewayDepositRequest";
import WithdrawModalBlocktrades from "../Modal/WithdrawModalBlocktrades";
import OpenLedgerFiatDepositWithdrawal from "./openledger/OpenLedgerFiatDepositWithdrawal";
import OpenLedgerFiatTransactionHistory from "./openledger/OpenLedgerFiatTransactionHistory";
import Tabs from "../Utility/Tabs";
var Post = require("../Utility/FormPost.js");

@BindToChainState({keep_updating:true})
class MetaexchangeDepositRequest extends React.Component {
    static propTypes = {
        gateway:           		React.PropTypes.string,
        symbol_pair: 			React.PropTypes.string,
		deposit_asset_name: 	React.PropTypes.string,
        account: 				ChainTypes.ChainAccount,
        issuer_account: 		ChainTypes.ChainAccount,
        deposit_asset: 			React.PropTypes.string,
		is_bts_deposit: 		React.PropTypes.string,
        receive_asset: 			ChainTypes.ChainAsset
    };
	
	constructor(props) 
	{
        super(props);

		let parts = props.symbol_pair.split('_');

        this.state = {
            deposit_address: null, 
   			memo:null, 
			base_symbol:parts[0],
			quote_symbol:parts[1]
		};
		this.apiRoot = "https://metaexchange.info/api";
		this.marketPath = "https://metaexchange.info/markets/";
		//this.apiRoot = "http://localhost:1235/api";
		//this.marketPath = "http://localhost:1235/markets/";
    }

	getDepositAddress()
	{
		Post.PostForm(this.apiRoot + '/1/submitAddress', {
					receiving_address:this.props.account.get('name'), 
					order_type:'buy', 
					symbol_pair:this.props.symbol_pair
				}).then( reply=>reply.json().then(reply=>
				{
					//console.log(reply);
					
					this.setState( {deposit_address:reply.deposit_address, memo:reply.memo} );
					
					let wallet = WalletDb.getWallet();
					let name = this.props.account.get('name');
					
					if( !wallet.deposit_keys ) wallet.deposit_keys = {}
					if( !wallet.deposit_keys[this.props.gateway] )
						wallet.deposit_keys[this.props.gateway] = {}
					if( !wallet.deposit_keys[this.props.gateway][this.state.base_symbol] )
						wallet.deposit_keys[this.props.gateway][this.state.base_symbol] = {}
					else
						wallet.deposit_keys[this.props.gateway][this.state.base_symbol][name] = reply
					
					WalletDb._updateWallet();
				}));
	}

    getWithdrawModalId() {
        return "withdraw" + this.getModalId();
    }
	
	getDepositModalId() {
        return "deposit" + this.getModalId();
    }
	
	getModalId() {
        return "_asset_"+this.props.issuer_account.get('name') + "_"+this.props.receive_asset.get('symbol');
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }
	
	onDeposit() {
        ZfApi.publish(this.getDepositModalId(), "open");
    }

	getMetaLink()
	{
		let wallet = WalletDb.getWallet();
		var withdrawAddr = "";
		
		try
		{
			withdrawAddr = wallet.deposit_keys[this.props.gateway][this.state.base_symbol]['withdraw_address'];
		}
		catch (Error) {}
		
		return this.marketPath + this.props.symbol_pair.replace('_','/')+'?receiving_address='+encodeURIComponent(this.props.account.get('name')+','+withdrawAddr);
	}

    render() {
        if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
            return <tr><td></td><td></td><td></td><td></td></tr>;
			
        let wallet = WalletDb.getWallet();
        
        if( !this.state.deposit_address )  
		{
			try
			{
				let reply = wallet.deposit_keys[this.props.gateway][this.state.base_symbol][this.props.account.get('name')];
				this.state.deposit_address = reply.deposit_address;
				this.state.memo = reply.memo;
			}
			catch (Error) {}
        }
        if( !this.state.deposit_address )
		{ 
			this.getDepositAddress(); 
		}
        
        let withdraw_modal_id = this.getWithdrawModalId();
		let deposit_modal_id = this.getDepositModalId();
		
        return <tr>
            <td>{this.props.deposit_asset} </td>


			<td> <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
                <Modal id={deposit_modal_id} overlay={true}>
                    <Trigger close={deposit_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <DepositModalMetaexchange
							api_root={this.apiRoot}
							symbol_pair={this.props.symbol_pair}
							gateway={this.props.gateway}
							deposit_address={this.state.deposit_address}
							memo={this.state.memo}
							is_bts_deposit={this.props.is_bts_deposit}
							receive_asset_name={this.props.deposit_asset_name}
                            receive_asset_symbol={this.props.deposit_asset}
                            modal_id={deposit_modal_id} />
                    </div>
                </Modal>
            </td>
			
			<td><button className={"button outline"}><a target="__blank" href={this.getMetaLink()}>Open in metaexchange</a></button></td>
			
            <td> <AccountBalance account={this.props.account.get('name')} asset={this.state.base_symbol} /> </td>
            <td> <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
                <Modal id={withdraw_modal_id} overlay={true}>
                    <Trigger close={withdraw_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <WithdrawModalMetaexchange
							api_root={this.apiRoot}
							gateway={this.props.gateway}
							order_type='sell'
							symbol_pair={this.props.symbol_pair}
                            account={this.props.account.get('name')}
                            issuer={this.props.issuer_account.get('name')}
							is_bts_withdraw={this.props.is_bts_deposit}
                            asset={this.props.receive_asset.get('symbol')}
                            receive_asset_name={this.props.deposit_asset_name}
                            receive_asset_symbol={this.props.deposit_asset}
                            modal_id={withdraw_modal_id} />
                    </div>
                </Modal>
            </td>
        </tr>
    }
}; // MetaexchangeDepositRequest

@BindToChainState({keep_updating:true})
class AccountDepositWithdraw extends React.Component {

    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
		gprops: ChainTypes.ChainObject.isRequired,
        dprops: ChainTypes.ChainObject.isRequired
    }
    static defaultProps = {
        gprops: "2.0.0",
        dprops: "2.1.0"
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            nextProps.account !== this.props.account ||
            nextProps.qprops !== this.props.qprops ||
            nextProps.dprops !== this.props.dprops
        );
    }

    render() {
        let openledger_deprecated_message = 
            "OpenLedger is replacing the original assets like OPENBTC with " +
            "namespaced-asset names like OPEN.BTC in order to protect against " +
            "look-alike asset names.  You can still withdraw the original " +
            "assets or trade them on the market, but OpenLedger will only be " +
            "issuing the new namespaced assets in the future, and we urge " +
            "everyone to transition when convenient";

        return (
		<div className="grid-content">
			<Tabs setting="depositWithdrawSettingsTab" defaultActiveTab={config.depositWithdrawDefaultActiveTab}>

                <Tabs.Tab title="Livecoin">
                    <div className="content-block">
                        <div className="float-right"><a href="https://www.livecoin.net/trade/index?currencyPair=THS/BTC" target="__blank">VISIT WEBSITE</a></div>
                        <h3><Translate content="gateway.bridge" /></h3>
                        <BlockTradesBridgeDepositRequest
                            gateway="blocktrades"
                            url="https://api.blocktrades.us/v2"
                            issuer_account="blocktrades"
                            account={this.props.account}
                            initial_deposit_input_coin_type="btc"
                            initial_deposit_output_coin_type="uns"
                            initial_deposit_estimated_input_amount="1.0"
                            initial_withdraw_input_coin_type="uns"
                            initial_withdraw_output_coin_type="btc"
                            initial_withdraw_estimated_input_amount="100000"
                        />
                    </div>
                    <div className="content-block">
                        <h3><Translate content="gateway.gateway" /></h3>
                        <table className="table">
                            <thead>
                            <tr>
                                <th><Translate content="gateway.symbol" /></th>
                                <th><Translate content="gateway.deposit_to" /></th>
                                <th><Translate content="gateway.balance" /></th>
                                <th><Translate content="gateway.withdraw" /></th>
                            </tr>
                            </thead>
                            <tbody>
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-btc"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                receive_asset="TRADE.BTC"
                                deposit_asset="BTC"
                                deposit_coin_type="btc"
                                deposit_asset_name="Bitcoin"
                                deposit_wallet_type="bitcoin"
                                receive_coin_type="trade.btc" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-ltc"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="ltc"
                                deposit_asset_name="Litecoin"
                                deposit_asset="LTC"
                                deposit_wallet_type="litecoin"
                                receive_asset="TRADE.LTC"
                                receive_coin_type="trade.ltc" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-doge"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="doge"
                                deposit_asset_name="Dogecoin"
                                deposit_asset="DOGE"
                                deposit_wallet_type="dogecoin"
                                receive_asset="TRADE.DOGE"
                                receive_coin_type="trade.doge" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-nsr"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="nsr"
                                deposit_asset_name="NuShares"
                                deposit_asset="NSR"
                                deposit_wallet_type="nushares"
                                receive_asset="TRADE.NSR"
                                receive_coin_type="trade.nsr" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-nbt"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="nbt"
                                deposit_asset_name="NuBits"
                                deposit_asset="NBT"
                                deposit_wallet_type="nubits"
                                receive_asset="TRADE.NBT"
                                receive_coin_type="trade.nbt" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-dash"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="dash"
                                deposit_asset_name="Dash"
                                deposit_asset="DASH"
                                deposit_wallet_type="dash"
                                receive_asset="TRADE.DASH"
                                receive_coin_type="trade.dash" />
                            <BlockTradesGatewayDepositRequest
                                key="blocktrades-trade-ppc"
                                gateway="blocktrades"
                                url="https://api.blocktrades.us/v2"
                                issuer_account="blocktrades"
                                account={this.props.account}
                                deposit_coin_type="ppc"
                                deposit_asset_name="Peercoin"
                                deposit_asset="PPC"
                                deposit_wallet_type="peercoin"
                                receive_asset="TRADE.PPC"
                                receive_coin_type="trade.ppc" />
                            </tbody>
                        </table>
                    </div>
                </Tabs.Tab>

            </Tabs>
		</div>
        )
    }
};


export default AccountDepositWithdraw;
