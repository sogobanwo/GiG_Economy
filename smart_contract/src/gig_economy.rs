use alloc::vec::Vec;

use alloc::string::String;

use alloy_sol_types::SolValue;
use stylus_sdk::{
    alloy_primitives::{Address, U256, U8},
    prelude::*,
    storage::{
        StorageAddress, StorageBool, StorageBytes, StorageGuard, StorageMap, StorageString,
        StorageU256, StorageU8,
    },
};

sol_interface! {
    interface IErc20 {
        function transferFrom(address from, address to, uint256 tokens) external;
        function transfer(address to, uint256 tokens) external;
    }
}

#[derive(Debug, PartialEq, Eq)]
pub enum TaskStatus {
    Open = 0,
    Completed = 1,
    Disputed = 2,
}

impl From<U8> for TaskStatus {
    fn from(value: U8) -> Self {
        match value.to::<u8>() {
            0 => TaskStatus::Open,
            1 => TaskStatus::Completed,
            2 => TaskStatus::Disputed,
            _ => TaskStatus::Open,
        }
    }
}

#[storage]
pub struct Submission {
    pub id: StorageU256,
    pub submitter: StorageAddress,
    pub content: StorageString,
    pub approved: StorageBool,
}
#[storage]
pub struct Task {
    pub id: StorageU256,
    pub creator: StorageAddress,
    pub bounty: StorageU256,
    pub token: StorageAddress,
    pub description: StorageString,
    pub status: StorageU8, // 0=Open, 1=Submitted, 2=Approved, 3=Disputed
    pub winner: StorageAddress,
}
#[storage]
pub struct UserStats {
    pub created_count: StorageU256,
    pub completed_count: StorageU256,
    pub total_earned: StorageU256,
}

// #[storage]
sol_storage! {
    #[entrypoint]
    // pub struct GigEconomy {
    //     pub tasks: StorageMap<U256, Task>,
    //     pub task_counter: StorageU256,
    //     pub task_submissions_counter: StorageMap<U256, StorageU256>,
    //     pub task_submissions: StorageMap<U256, StorageMap<U256, Submission>>,
    //     pub user_stats: StorageMap<Address, UserStats>,
    // }
    pub struct GigEconomy {
     mapping(uint256 => Task) tasks;
     uint256 task_counter;
     mapping(uint256 => uint256) task_submissions_counter;
     mapping(uint256 => mapping(uint256 => Submission)) task_submissions;
     mapping(address => UserStats) user_stats;
    }
}

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
        task.status.set(U8::from(TaskStatus::Open as u8));

        self.task_counter.set(id);

        let total_created;
        {
            total_created = self.user_stats.get(creator).created_count.get();
        }
        let mut stat = self.user_stats.setter(creator);
        stat.created_count.set(total_created + U256::from(1));
    }

    pub fn submit_task(&mut self, task_id: U256, content: String) {
        // assert!(!content.is_empty(), "Content cannot be empty");
        self._check_if_task_id_is_valid(&task_id);

        let submitter = self._get_msg_sender();
        let task = self.tasks.get(task_id);
        self._check_if_task_is_open(&task.status.get());

        let new_sub_id = self.task_submissions_counter.get(task_id) + U256::from(1);
        let mut binding = self.task_submissions.setter(task_id);
        let mut submission = binding.setter(new_sub_id);

        submission.id.set(new_sub_id);
        submission.submitter.set(submitter);
        submission.content.set_str(content);
        submission.approved.set(false);

        self.task_submissions_counter
            .setter(task_id)
            .set(new_sub_id);
    }
    fn approve_submission(&mut self, task_id: U256, submission_id: U256) {
        self._check_if_task_id_is_valid(&task_id);
        {
            let task = self.tasks.get(task_id);
            self._check_if_task_is_open(&task.status.get());
            // self._assert_owner(&task.creator.get());
            // let creator: Address = self._get_msg_sender();
            self._check_if_a_valid_submission_id(&submission_id, &task_id);
        }

        {
            let mut task_u = self.tasks.setter(task_id);
            task_u.status.set(U8::from(1));
        }
        let completer = self
            .task_submissions
            .get(task_id)
            .get(submission_id)
            .submitter
            .get();
        self.task_submissions
            .setter(task_id)
            .setter(submission_id)
            .approved
            .set(true);
        let bounty;
        let token_addr;
        {
            let task_ro = self.tasks.get(task_id);
            bounty = task_ro.bounty.get();
            token_addr = task_ro.token.get();
        }
        let token_contract = IErc20::new(token_addr);
        let _ = token_contract.transfer(&mut *self, completer, bounty);

        let completed_count;
        {
            completed_count = self.user_stats.get(completer).completed_count.get();
        }
        let mut stats = self.user_stats.setter(completer);
        stats.completed_count.set(completed_count);
        stats.total_earned.set(bounty);
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
        let status: TaskStatus = TaskStatus::from(*status);
        assert!(status == TaskStatus::Open, "Task not open");
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

// use alloc::string::String;
// use alloc::vec::Vec;
// use stylus_sdk::{
//     alloy_primitives::{Address, U256, U8},
//     alloy_sol_types::{sol, SolError},
//     prelude::*,
//     storage::{
//         StorageAddress, StorageBool, StorageBytes, StorageMap, StorageString, StorageU256,
//         StorageU8,
//     },
// };

// // ============ INTERFACES ============
// sol_interface! {
//     interface IErc20 {
//         function transferFrom(address from, address to, uint256 tokens) external returns (bool);
//         function transfer(address to, uint256 tokens) external returns (bool);
//     }
// }

// // ============ ERRORS ============
// sol! {
//     error EmptyDescription();
//     error ZeroBounty();
//     error TokenTransferFailed();
//     error InvalidTaskId(uint256 taskId);
//     error TaskNotOpen(uint256 taskId, uint8 status);
//     error NotTaskOwner(address caller, address owner);
//     error EmptyContent();
//     error CreatorCannotSubmit(address creator);
//     error InvalidSubmissionId(uint256 submissionId, uint256 maxSubmissionId);
//     error BountyTransferFailed(address token, address recipient, uint256 amount);
//     error TaskAlreadyCompleted(uint256 taskId);
//     error ZeroAddress();
// }

// // ============ ENUMS ============
// #[derive(Debug, PartialEq, Eq, Clone, Copy)]
// pub enum TaskStatus {
//     Open = 0,
//     Completed = 1,
//     Disputed = 2,
// }

// impl From<U8> for TaskStatus {
//     fn from(value: U8) -> Self {
//         match value.to::<u8>() {
//             1 => TaskStatus::Completed,
//             2 => TaskStatus::Disputed,
//             _ => TaskStatus::Open,
//         }
//     }
// }

// impl From<TaskStatus> for U8 {
//     fn from(status: TaskStatus) -> Self {
//         U8::from(status as u8)
//     }
// }

// // ============ STORAGE STRUCTS ============
// #[storage]
// pub struct Submission {
//     pub id: StorageU256,
//     pub submitter: StorageAddress,
//     pub content: StorageString,
//     pub approved: StorageBool,
//     pub timestamp: StorageU256,
// }

// #[storage]
// pub struct Task {
//     pub id: StorageU256,
//     pub creator: StorageAddress,
//     pub bounty: StorageU256,
//     pub token: StorageAddress,
//     pub description: StorageBytes,
//     pub status: StorageU8,
//     pub winner: StorageAddress,
//     pub created_at: StorageU256,
// }

// #[storage]
// pub struct UserStats {
//     pub created_count: StorageU256,
//     pub completed_count: StorageU256,
//     pub total_earned: StorageU256,
//     pub total_spent: StorageU256,
// }

// #[storage]
// #[entrypoint]
// pub struct GigEconomy {
//     pub tasks: StorageMap<U256, Task>,
//     pub task_counter: StorageU256,
//     pub task_submissions_counter: StorageMap<U256, StorageU256>,
//     pub task_submissions: StorageMap<U256, StorageMap<U256, Submission>>,
//     pub user_stats: StorageMap<Address, UserStats>,
// }

// // ============ ERRORS IMPLEMENTATION ============
// #[derive(SolidityError)]
// pub enum GigEconomyError {
//     EmptyDescription(EmptyDescription),
//     ZeroBounty(ZeroBounty),
//     TokenTransferFailed(TokenTransferFailed),
//     InvalidTaskId(InvalidTaskId),
//     TaskNotOpen(TaskNotOpen),
//     NotTaskOwner(NotTaskOwner),
//     EmptyContent(EmptyContent),
//     CreatorCannotSubmit(CreatorCannotSubmit),
//     InvalidSubmissionId(InvalidSubmissionId),
//     BountyTransferFailed(BountyTransferFailed),
//     TaskAlreadyCompleted(TaskAlreadyCompleted),
//     ZeroAddress(ZeroAddress),
// }

// // ============ PUBLIC FUNCTIONS ============
// #[public]
// impl GigEconomy {
//     /// Create a new task
//     pub fn create_task(
//         &mut self,
//         description: String,
//         bounty: U256,
//         token_address: Address,
//     ) -> Result<U256, GigEconomyError> {
//         // Validation
//         if description.is_empty() {
//             return Err(GigEconomyError::EmptyDescription(EmptyDescription {}));
//         }

//         if bounty == U256::ZERO {
//             return Err(GigEconomyError::ZeroBounty(ZeroBounty {}));
//         }

//         if token_address == Address::ZERO {
//             return Err(GigEconomyError::ZeroAddress(ZeroAddress {}));
//         }

//         let creator = self.vm().msg_sender();
//         let id = self.task_counter.get() + U256::from(1);
//         let contract_addr = self.vm().contract_address();
//         let current_time = U256::from(self.vm().block_timestamp());

//         // Transfer tokens from creator to contract
//         let token_contract = IErc20::new(token_address);
//         let config = Call::new();

//         match token_contract.transfer_from(config, creator, contract_addr, bounty) {
//             Ok(_) => {}
//             Err(_) => return Err(GigEconomyError::TokenTransferFailed(TokenTransferFailed {})),
//         }

//         // Create task - using scoped borrows like Ethos pattern
//         {
//             let mut task = self.tasks.setter(id);
//             task.id.set(id);
//             task.creator.set(creator);
//             task.bounty.set(bounty);
//             task.token.set(token_address);
//             task.description.set_bytes(&description.into_bytes());
//             task.status.set(TaskStatus::Open.into());
//             task.winner.set(Address::ZERO);
//             task.created_at.set(current_time);
//         }

//         self.task_counter.set(id);

//         // Update creator stats - proper memory management
//         let total_created;
//         let total_spent;
//         {
//             let stats = self.user_stats.get(creator);
//             total_created = stats.created_count.get();
//             total_spent = stats.total_spent.get();
//         }

//         {
//             let mut stat = self.user_stats.setter(creator);
//             stat.created_count.set(total_created + U256::from(1));
//             stat.total_spent.set(total_spent + bounty);
//         }

//         Ok(id)
//     }

//     /// Submit work for a task
//     pub fn submit_task(&mut self, task_id: U256, content: String) -> Result<U256, GigEconomyError> {
//         if content.is_empty() {
//             return Err(GigEconomyError::EmptyContent(EmptyContent {}));
//         }

//         if !self.is_valid_task_id(&task_id) {
//             return Err(GigEconomyError::InvalidTaskId(InvalidTaskId {
//                 taskId: task_id,
//             }));
//         }

//         let submitter = self.vm().msg_sender();
//         let current_time = U256::from(self.vm().block_timestamp());

//         // Get task details with proper scope
//         let creator;
//         let status;
//         {
//             let task = self.tasks.get(task_id);
//             creator = task.creator.get();
//             status = task.status.get();
//         }

//         if TaskStatus::from(status) != TaskStatus::Open {
//             return Err(GigEconomyError::TaskNotOpen(TaskNotOpen {
//                 taskId: task_id,
//                 status as u8,
//             }));
//         }

//         if creator == submitter {
//             return Err(GigEconomyError::CreatorCannotSubmit(CreatorCannotSubmit {
//                 creator,
//             }));
//         }

//         let new_sub_id = self.task_submissions_counter.get(task_id) + U256::from(1);

//         // Create submission with proper scope
//         {
//             let mut binding = self.task_submissions.setter(task_id);
//             let mut submission = binding.setter(new_sub_id);
//             submission.id.set(new_sub_id);
//             submission.submitter.set(submitter);
//             submission.content.set_str(content);
//             submission.approved.set(false);
//             submission.timestamp.set(current_time);
//         }

//         self.task_submissions_counter
//             .setter(task_id)
//             .set(new_sub_id);

//         Ok(new_sub_id)
//     }

//     /// Approve a submission and release bounty
//     pub fn approve_submission(
//         &mut self,
//         task_id: U256,
//         submission_id: U256,
//     ) -> Result<(), GigEconomyError> {
//         if !self.is_valid_task_id(&task_id) {
//             return Err(GigEconomyError::InvalidTaskId(InvalidTaskId {
//                 taskId: task_id,
//             }));
//         }

//         let max_sub_id = self.task_submissions_counter.get(task_id);
//         if submission_id == U256::ZERO || submission_id > max_sub_id {
//             return Err(GigEconomyError::InvalidSubmissionId(InvalidSubmissionId {
//                 submissionId: submission_id,
//                 maxSubmissionId: max_sub_id,
//             }));
//         }

//         let caller = self.vm().msg_sender();

//         // Get task details with proper scope
//         let creator;
//         let status;
//         let bounty;
//         let token_addr;
//         {
//             let task = self.tasks.get(task_id);
//             creator = task.creator.get();
//             status = task.status.get();
//             bounty = task.bounty.get();
//             token_addr = task.token.get();
//         }

//         if TaskStatus::from(status) != TaskStatus::Open {
//             return Err(GigEconomyError::TaskNotOpen(TaskNotOpen {
//                 taskId: task_id,
//                 status,
//             }));
//         }

//         if creator != caller {
//             return Err(GigEconomyError::NotTaskOwner(NotTaskOwner {
//                 caller,
//                 owner: creator,
//             }));
//         }

//         // Get completer
//         let completer;
//         {
//             let submission = self.task_submissions.get(task_id).get(submission_id);
//             completer = submission.submitter.get();
//         }

//         // Update task status and winner
//         {
//             let mut task_u = self.tasks.setter(task_id);
//             task_u.status.set(TaskStatus::Completed.into());
//             task_u.winner.set(completer);
//         }

//         // Mark submission as approved
//         {
//             let mut binding = self.task_submissions.setter(task_id);
//             let mut submission = binding.setter(submission_id);
//             submission.approved.set(true);
//         }

//         // Transfer bounty to completer
//         let token_contract = IErc20::new(token_addr);
//         let config = Call::new();

//         match token_contract.transfer(config, completer, bounty) {
//             Ok(_) => {}
//             Err(_) => {
//                 return Err(GigEconomyError::BountyTransferFailed(
//                     BountyTransferFailed {
//                         token: token_addr,
//                         recipient: completer,
//                         amount: bounty,
//                     },
//                 ))
//             }
//         }

//         // Update completer stats with proper memory management
//         let completed_count;
//         let total_earned;
//         {
//             let stats = self.user_stats.get(completer);
//             completed_count = stats.completed_count.get();
//             total_earned = stats.total_earned.get();
//         }

//         {
//             let mut stats = self.user_stats.setter(completer);
//             stats.completed_count.set(completed_count + U256::from(1));
//             stats.total_earned.set(total_earned + bounty);
//         }

//         Ok(())
//     }

//     /// Dispute a task
//     pub fn dispute_task(&mut self, task_id: U256) -> Result<(), GigEconomyError> {
//         if !self.is_valid_task_id(&task_id) {
//             return Err(GigEconomyError::InvalidTaskId(InvalidTaskId {
//                 taskId: task_id,
//             }));
//         }

//         let caller = self.vm().msg_sender();

//         let creator;
//         let status;
//         {
//             let task = self.tasks.get(task_id);
//             creator = task.creator.get();
//             status = task.status.get();
//         }

//         if creator != caller {
//             return Err(GigEconomyError::NotTaskOwner(NotTaskOwner {
//                 caller,
//                 owner: creator,
//             }));
//         }

//         if TaskStatus::from(status) != TaskStatus::Open {
//             return Err(GigEconomyError::TaskNotOpen(TaskNotOpen {
//                 taskId: task_id,
//                 status,
//             }));
//         }

//         {
//             let mut task = self.tasks.setter(task_id);
//             task.status.set(TaskStatus::Disputed.into());
//         }

//         Ok(())
//     }

//     // ========== VIEW FUNCTIONS ==========

//     pub fn get_all_tasks_counter(&self) -> U256 {
//         self.task_counter.get()
//     }

//     pub fn get_task_submission_counter(&self, task_id: U256) -> U256 {
//         self.task_submissions_counter.get(task_id)
//     }

//     pub fn get_task(
//         &self,
//         task_id: U256,
//     ) -> Result<(U256, Address, U256, Address, U8, Address, String, U256), GigEconomyError> {
//         if !self.is_valid_task_id(&task_id) {
//             return Err(GigEconomyError::InvalidTaskId(InvalidTaskId {
//                 taskId: task_id,
//             }));
//         }

//         let task = self.tasks.get(task_id);
//         Ok((
//             task.id.get(),
//             task.creator.get(),
//             task.bounty.get(),
//             task.token.get(),
//             task.status.get(),
//             task.winner.get(),
//             String::from_utf8(task.description.get_bytes()).unwrap_or_default(),
//             task.created_at.get(),
//         ))
//     }

//     pub fn get_task_submission(
//         &self,
//         task_id: U256,
//         submission_id: U256,
//     ) -> Result<(U256, Address, String, bool, U256), GigEconomyError> {
//         if !self.is_valid_task_id(&task_id) {
//             return Err(GigEconomyError::InvalidTaskId(InvalidTaskId {
//                 taskId: task_id,
//             }));
//         }

//         let max_sub_id = self.task_submissions_counter.get(task_id);
//         if submission_id == U256::ZERO || submission_id > max_sub_id {
//             return Err(GigEconomyError::InvalidSubmissionId(InvalidSubmissionId {
//                 submissionId: submission_id,
//                 maxSubmissionId: max_sub_id,
//             }));
//         }

//         let submission = self.task_submissions.get(task_id).get(submission_id);
//         Ok((
//             submission.id.get(),
//             submission.submitter.get(),
//             submission.content.get_string(),
//             submission.approved.get(),
//             submission.timestamp.get(),
//         ))
//     }

//     pub fn get_user_stats(&self, user: Address) -> (U256, U256, U256, U256) {
//         let stats = self.user_stats.get(user);
//         (
//             stats.created_count.get(),
//             stats.completed_count.get(),
//             stats.total_earned.get(),
//             stats.total_spent.get(),
//         )
//     }

//     pub fn is_task_open(&self, task_id: U256) -> bool {
//         if !self.is_valid_task_id(&task_id) {
//             return false;
//         }
//         let task = self.tasks.get(task_id);
//         TaskStatus::from(task.status.get()) == TaskStatus::Open
//     }
// }

// // ============ INTERNAL HELPERS ============
// impl GigEconomy {
//     fn is_valid_task_id(&self, task_id: &U256) -> bool {
//         *task_id > U256::ZERO && *task_id <= self.task_counter.get()
//     }
// }
