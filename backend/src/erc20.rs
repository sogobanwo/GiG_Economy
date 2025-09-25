

// use alloc::vec::Vec;

// use alloy_primitives::{Address, U256};
// use stylus_sdk::prelude::{storage};
// use openzeppelin_stylus::token::erc20::{self, Erc20, IErc20};


// #[storage]
// // #[entrypoint]
// pub struct GigTestToken {
//     erc20: Erc20,
// }

// // #[implements(IErc20<Error = Error>)]
// // impl GigTestToken {}


// #[public]
// impl IErc20 for GigTestToken {

//     type Error = erc20::Error;
    
//     fn total_supply(&self) -> U256 {
//         self.erc20.total_supply()
//     }

//     fn balance_of(&self, account: Address) -> U256 {
//         self.erc20.balance_of(account)
//     }

//     fn transfer(
//         &mut self,
//         to: Address,
//         value: U256,
//     ) -> Result<bool, Self::Error> {
//         self.erc20.transfer(to, value)
//     }

//     fn allowance(&self, owner: Address, spender: Address) -> U256 {
//         self.erc20.allowance(owner, spender)
//     }  

//     fn approve(
//         &mut self,
//         spender: Address,
//         value: U256,
//     ) -> Result<bool, Self::Error> {
//         self.erc20.approve(spender, value)
//     }  

//     fn transfer_from(
//         &mut self,
//         from: Address,
//         to: Address,
//         value: U256,
//     ) -> Result<bool, Self::Error> {
//         self.erc20.transfer_from(from, to, value)   
//     }
// }