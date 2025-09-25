use alloc::string::String;
use alloc::vec::Vec;

use stylus_sdk::{
    alloy_primitives::{Address, U256},
    prelude::*,
    storage::{StorageMap, StorageString, StorageU256},
};

#[storage]
// #[entrypoint]
pub struct MockErc20 {
    pub name: StorageString,
    pub symbol: StorageString,
    pub decimals: StorageU256,
    pub total_supply: StorageU256,
    pub balances: StorageMap<Address, StorageU256>,
    pub allowances: StorageMap<Address, StorageMap<Address, StorageU256>>,
}

#[public]
impl MockErc20 {
    pub fn init(&mut self, name: String, symbol: String, decimals: U256, supply: U256) {
        let sender = self.vm().msg_sender();

        self.name.set_str(&name);
        self.symbol.set_str(&symbol);
        self.decimals.set(decimals);
        self.total_supply.set(supply);
        self.balances.setter(sender).set(supply);
    }

    pub fn balance_of(&self, owner: Address) -> U256 {
        self.balances.get(owner)
    }

    pub fn allowance(&self, owner: Address, spender: Address) -> U256 {
        self.allowances.get(owner).get(spender)
    }

    pub fn transfer(&mut self, to: Address, amount: U256) -> bool {
        let sender = self.vm().msg_sender();
        self._transfer(sender, to, amount)
    }

    pub fn approve(&mut self, spender: Address, amount: U256) -> bool {
        let sender = self.vm().msg_sender();
        self.allowances.setter(sender).setter(spender).set(amount);
        true
    }

    pub fn transfer_from(&mut self, from: Address, to: Address, amount: U256) -> bool {
        let sender = self.vm().msg_sender();
        let current_allowance = self.allowances.get(from).get(sender);
        assert!(current_allowance >= amount, "ERC20: insufficient allowance");

        self.allowances
            .setter(from)
            .setter(sender)
            .set(current_allowance - amount);
        self._transfer(from, to, amount)
    }
}

impl MockErc20 {
    fn _transfer(&mut self, from: Address, to: Address, amount: U256) -> bool {
        assert!(amount > U256::from(0), "ERC20: zero transfer");

        let from_balance = self.balances.get(from);
        assert!(from_balance >= amount, "ERC20: insufficient balance");

        self.balances.setter(from).set(from_balance - amount);

        let to_balance = self.balances.get(to);
        self.balances.setter(to).set(to_balance + amount);

        true
    }
}
