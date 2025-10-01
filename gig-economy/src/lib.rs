#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;

use alloy_primitives::Address;
use alloy_primitives::U8;
use stylus_sdk::{alloy_primitives::U256, prelude::*};

sol_storage! {
    #[entrypoint]
    pub struct GigEconomy {
        address token;
        bool initialized;
        uint256 taskCount;
        mapping(uint256 => uint256) taskSubmissionsCount;
        mapping(uint256 => Task) tasks;
        mapping(uint256 => mapping(uint256 => Submission)) taskSubmissions;
    }

    pub struct Task {
        address creator;
        string name;
        uint256 bounty;
        uint8 status; // 1 = open, 2 = closed
        address winner;
    }

    pub struct Submission {
        address submitter;
        string submission;
    }
}

sol_interface! {
    interface IErc20 {
        function transferFrom(address from, address to, uint256 tokens) external;
        function transfer(address to, uint256 tokens) external;
        function balanceOf(address owner) external view returns (uint256);
    }
}

#[public]
impl GigEconomy {
    pub fn init(&mut self, token: Address) {
        self.token.set(token);
        self.initialized.set(true);
    }

    pub fn token(&self) -> Address {
        self.token.get()
    }

    pub fn get_task_count(&self) -> U256 {
        self.taskCount.get()
    }

    pub fn get_task_submission_count(&self, task_id: U256) -> U256 {
        self.taskSubmissionsCount.get(task_id)
    }

    pub fn create_task(&mut self, name: String, bount: U256) -> U256 {
        self._assert_init();
        let task_id = self.taskCount.get() + U256::from(1);
        let creator = self.vm().msg_sender();
        {
            self._transfer_from(creator, bount);
        }
        let mut task = self.tasks.setter(task_id);
        task.creator.set(creator);
        task.name.set_str(name);
        task.bounty.set(bount);
        self.taskCount.set(task_id);
        task.status.set(U8::from(1));
        task_id
    }

    pub fn submit_task(&mut self, task_id: U256, submission: String) {
        self._assert_init();
        let task = self.tasks.get(task_id);
        assert!(task.status.get() == U8::from(1), "Task is not open");
        let submitter = self.vm().msg_sender();
        let sub_id = self.taskSubmissionsCount.get(task_id) + U256::from(1);
        let mut bind = self.taskSubmissions.setter(task_id);
        let mut sub = bind.setter(sub_id);
        sub.submitter.set(submitter);
        sub.submission.set_str(submission);
        self.taskSubmissionsCount.setter(task_id).set(sub_id);
    }

    pub fn approve_submission(&mut self, task_id: U256, sub_id: U256) {
        self._assert_init();
        let task = self.tasks.get(task_id);
        assert!(task.status.get() == U8::from(1), "Task is not open");

        let interactor = self.vm().msg_sender();
        assert!(interactor == task.creator.get(), "not the creator");

        let binding = self.taskSubmissions.get(task_id);
        let submission = binding.get(sub_id);
        let bounty_amount = task.bounty.get();

        {
            let mut task = self.tasks.setter(task_id);
            task.status.set(U8::from(2));
            task.winner.set(submission.submitter.get());
        }

        {
            self._transfer(submission.submitter.get(), bounty_amount);
        }
    }

    pub fn get_task(&self, id: U256) -> (String, Address, U256, U8, Address) {
        let task = self.tasks.getter(id);
        (
            task.name.get_string(),
            task.creator.get(),
            task.bounty.get(),
            task.status.get(),
            task.winner.get(),
        )
    }

    pub fn get_submission(&self, task_id: U256, sub_id: U256) -> (Address, String) {
        let binding = self.taskSubmissions.get(task_id);
        let submission = binding.get(sub_id);
        (
            submission.submitter.get(),
            submission.submission.get_string(),
        )
    }
}

impl GigEconomy {
    fn _assert_init(&self) {
        assert!(self.initialized.get() == true)
    }

    fn _transfer_from(&mut self, from: Address, amount: U256) {
        let token_contract = IErc20::new(self.token.get());
        let contract_address = self.vm().contract_address();
        let _ = token_contract.transfer_from(&mut *self, from, contract_address, amount);
    }

    fn _transfer(&mut self, to: Address, amount: U256) {
        let token_contract = IErc20::new(self.token.get());
        let _ = token_contract.transfer(&mut *self, to, amount);
    }
}
