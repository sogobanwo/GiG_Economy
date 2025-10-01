use alloc::vec::Vec;

use alloc::string::String;

use alloy_sol_types::sol;
use stylus_sdk::{
    alloy_primitives::{Address, U256, U8},
    prelude::*,
};

sol_interface! {
    interface IErc20 {
        function transferFrom(address from, address to, uint256 tokens) external;
        function transfer(address to, uint256 tokens) external;
    }
}

sol_storage! {

    pub struct Submission {
        uint256 id;
        address submitter;
        string content;
        bool approved;
    }

    pub struct UserStats {
        uint256 created_count;
        uint256 completed_count;
        uint256 total_earned;
    }

    pub struct Task {
        uint256 id;
        address creator;
        uint256 bounty;
        address token;
        string description;
        uint8 status; // 0=Open, 1=Submitted, 2=Approved, 3=Disputed
        address winner;
    }

    #[entrypoint]
    pub struct GigEconomy {
     mapping(uint256 => Task) tasks;
     uint256 task_counter;
     mapping(uint256 => uint256) task_submissions_counter;
     mapping(uint256 => mapping(uint256 => Submission)) task_submissions;
     mapping(address => UserStats) user_stats;
    }
}

sol! (
    event TaskCreated(uint256 indexed id, address indexed creator, uint256 bounty);
    event TaskSubmitted(uint256 indexed id, address indexed submitter,);
    event TaskApproved(uint256 indexed id, address indexed winner);
    event TaskDisputed(uint256 indexed id, address indexed submitter);
);

#[public]
impl GigEconomy {
    pub fn create_task(&mut self, description: String, bounty: U256, token_address: Address) {
        // assert!(!description.is_empty(), "empty");

        let creator = self._get_msg_sender();
        let id = self.task_counter.get() + U256::from(1);
        let contract_addr = self.vm().contract_address();

        let token_contract = IErc20::new(token_address);
        let _ = token_contract.transfer_from(&mut *self, creator, contract_addr, bounty);

        let mut task = self.tasks.setter(id);
        task.id.set(id);
        task.creator.set(creator);
        task.bounty.set(bounty);
        task.token.set(token_address);
        task.description.set_str(&description);
        task.status.set(U8::from(0));

        self.task_counter.set(id);

        let total_created;
        {
            total_created = self.user_stats.get(creator).created_count.get();
        }
        let mut stat = self.user_stats.setter(creator);
        stat.created_count.set(total_created + U256::from(1));

        log(
            self.vm(),
            TaskCreated {
                id,
                creator,
                bounty,
            },
        );
    }

    pub fn submit_task(&mut self, task_id: U256, content: String) {
        self._check_if_task_id_is_valid(&task_id);

        let submitter = self._get_msg_sender();
        let task = self.tasks.get(task_id);
        self._check_if_task_is_open(&task.status.get());

        let new_sub_id = self.task_submissions_counter.get(task_id) + U256::from(1);
        let mut binding = self.task_submissions.setter(task_id);
        let mut submission = binding.setter(new_sub_id);

        submission.id.set(new_sub_id);
        submission.submitter.set(submitter);
        submission.content.set_str(&content);
        submission.approved.set(false);

        self.task_submissions_counter
            .setter(task_id)
            .set(new_sub_id);

        // Emit event
        log(
            self.vm(),
            TaskSubmitted {
                id: task_id,
                submitter,
            },
        );
    }

    // Fixed approve_submission function - NOW PUBLIC
    pub fn approve_submission(&mut self, task_id: U256, submission_id: U256) {
        self._check_if_task_id_is_valid(&task_id);

        let creator;
        {
            let task = self.tasks.get(task_id);
            self._check_if_task_is_open(&task.status.get());
            creator = task.creator.get();
            self._assert_owner(&creator);
            self._check_if_a_valid_submission_id(&submission_id, &task_id);
        }

        let completer = self
            .task_submissions
            .get(task_id)
            .get(submission_id)
            .submitter
            .get();

        // Update task status and winner
        {
            let mut task_u = self.tasks.setter(task_id);
            task_u.status.set(U8::from(2)); // 2 = Approved
            task_u.winner.set(completer);
        }

        // Approve submission
        self.task_submissions
            .setter(task_id)
            .setter(submission_id)
            .approved
            .set(true);

        // Transfer bounty
        let bounty;
        let token_addr;
        {
            let task_ro = self.tasks.get(task_id);
            bounty = task_ro.bounty.get();
            token_addr = task_ro.token.get();
        }
        let token_contract = IErc20::new(token_addr);
        let _ = token_contract.transfer(&mut *self, completer, bounty);

        // Update user stats correctly
        let completed_count;
        let total_earned;
        {
            let stats_ro = self.user_stats.get(completer);
            completed_count = stats_ro.completed_count.get();
            total_earned = stats_ro.total_earned.get();
        }
        let mut stats = self.user_stats.setter(completer);
        stats.completed_count.set(completed_count + U256::from(1)); // INCREMENT
        stats.total_earned.set(total_earned + bounty); // ADD bounty

        // Emit event
        log(
            self.vm(),
            TaskApproved {
                id: task_id,
                winner: completer,
            },
        );
    }

    pub fn get_all_tasks_counter(&self) -> U256 {
        self.task_counter.get()
    }
    pub fn get_task_submission_counter(&self, task_id: U256) -> U256 {
        self.task_submissions_counter.get(task_id)
    }
    pub fn get_task(&self, task_id: U256) -> (U256, Address, U256, Address, String, U8, Address) {
        self._check_if_task_id_is_valid(&task_id);
        let task = self.tasks.get(task_id);
        (
            task.id.get(),
            task.creator.get(),
            task.bounty.get(),
            task.token.get(),
            task.description.get_string(),
            task.status.get(),
            task.winner.get(),
        )
    }
    pub fn get_task_submission(
        &self,
        task_id: U256,
        submission_id: U256,
    ) -> (U256, Address, bool, String) {
        self._check_if_task_id_is_valid(&task_id);
        self._check_if_a_valid_submission_id(&submission_id, &task_id);
        let submissions_map = self.task_submissions.get(task_id);
        let submission = submissions_map.get(submission_id);
        let id = submission.id.get();
        let submitter = submission.submitter.get();
        let content = submission.content.get_string();
        let approved = submission.approved.get();
        (id, submitter, approved, content)
    }
}

impl GigEconomy {
    fn _check_if_task_id_is_valid(&self, task_id: &U256) {
        assert!(self.task_counter.get() >= *task_id, "");
    }
    fn _check_if_task_is_open(&self, status: &U8) {
        assert!(status == &U8::from(0), "Task not open");
    }
    fn _get_msg_sender(&self) -> Address {
        self.vm().msg_sender()
    }
    fn _check_if_a_valid_submission_id(&self, sub_id: &U256, task_id: &U256) {
        let total_task_submission_counter = self.task_submissions_counter.get(*task_id);

        assert!(total_task_submission_counter >= *sub_id, "");
    }
    fn _assert_owner(&self, _address: &Address) {
        assert!(*_address == self._get_msg_sender(), "not owner")
    }
}
