//!
//! Decentralized Task Marketplace
//!
//! A dApp on Arbitrum Stylus that enables users to post micro-tasks with bounties in ETH,
//! and others to complete tasks and claim bounties.
//!
//! Note: this code is for MVP demonstration and has not been audited.
//!

// Allow `cargo stylus export-abi` to generate a main function.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
#![cfg_attr(not(any(test, feature = "export-abi")), no_std)]

#[macro_use]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;

/// Import items from the SDK. The prelude contains common traits and macros.
use stylus_sdk::{
    alloy_primitives::{Address, U256, U8},
    prelude::*,
};
use alloy_sol_types::sol;

// Define task status enum
#[derive(Debug, Clone, PartialEq)]
pub enum TaskStatus {
    Open = 0,
    Submitted = 1,
    Approved = 2,
    Disputed = 3,
}

impl From<U8> for TaskStatus {
    fn from(value: U8) -> Self {
        match value.to::<u8>() {
            0 => TaskStatus::Open,
            1 => TaskStatus::Submitted,
            2 => TaskStatus::Approved,
            3 => TaskStatus::Disputed,
            _ => TaskStatus::Open, // Default fallback
        }
    }
}

// Define task structure
sol_storage! {
    pub struct Task {
        address creator;
        uint256 bounty;
        string description;
        uint8 status; // 0=Open, 1=Submitted, 2=Approved, 3=Disputed
        address completer;
        string submission;
    }
}

// Define the main contract storage
sol_storage! {
    #[entrypoint]
    pub struct TaskMarketplace {
        uint256 task_count;
        mapping(uint256 => Task) tasks;
    }
}

// Define events for frontend tracking
sol! {
    event TaskCreated(uint256 indexed task_id, address indexed creator, uint256 bounty, string description);
    event TaskSubmitted(uint256 indexed task_id, address indexed completer, string submission);
    event TaskApproved(uint256 indexed task_id, address indexed completer, uint256 bounty);
    event TaskDisputed(uint256 indexed task_id, address indexed creator);
    event TaskWithdrawn(uint256 indexed task_id, address indexed creator, uint256 bounty);
}


/// Contract implementation with external methods
#[public]
impl TaskMarketplace {
    /// Creates a new task with a bounty in ETH
    /// @param description: Task description (max 256 characters)
    #[payable]
    pub fn create_task(&mut self, description: String) -> Result<U256, Vec<u8>> {
        let bounty = self.vm().msg_value();
        let creator = self.vm().msg_sender();

        // Input validation
        if bounty == U256::ZERO {
            return Err(b"Bounty must be greater than zero".to_vec());
        }

        if description.len() > 256 {
            return Err(b"Description too long (max 256 chars)".to_vec());
        }

        if description.is_empty() {
            return Err(b"Description cannot be empty".to_vec());
        }

        // Increment task counter and get new task ID
        let current_count = self.task_count.get();
        let task_id = current_count + U256::from(1);
        self.task_count.set(task_id);

        // Create and store the task
        let mut task = self.tasks.setter(task_id);
        task.creator.set(creator);
        task.bounty.set(bounty);
        task.description.set_str(&description);
        task.status.set(U8::from(TaskStatus::Open as u8));
        task.completer.set(Address::ZERO);
        task.submission.set_str("");

        // Emit event
        log(self.vm(), TaskCreated {
            task_id,
            creator,
            bounty,
            description,
        });

        Ok(task_id)
    }

    /// Submit work for a task
    /// @param task_id: ID of the task to submit for
    /// @param submission: Submission content (e.g., URL or text)
    pub fn submit_task(&mut self, task_id: U256, submission: String) -> Result<(), Vec<u8>> {
        let completer = self.vm().msg_sender();

        // Input validation
        if submission.is_empty() {
            return Err(b"Submission cannot be empty".to_vec());
        }

        if submission.len() > 512 {
            return Err(b"Submission too long (max 512 chars)".to_vec());
        }

        // Check if task exists
        if task_id > self.task_count.get() || task_id == U256::ZERO {
            return Err(b"Task does not exist".to_vec());
        }

        let mut task = self.tasks.setter(task_id);
        let current_status = TaskStatus::from(task.status.get());

        // Check task status
        if current_status != TaskStatus::Open {
            return Err(b"Task is not open for submissions".to_vec());
        }

        // Check if creator is trying to submit to their own task
        if task.creator.get() == completer {
            return Err(b"Creator cannot submit to their own task".to_vec());
        }

        // Update task with submission
        task.completer.set(completer);
        task.submission.set_str(&submission);
        task.status.set(U8::from(TaskStatus::Submitted as u8));

        // Emit event
        log(self.vm(), TaskSubmitted {
            task_id,
            completer,
            submission,
        });

        Ok(())
    }

    /// Approve a task submission and release bounty to completer
    /// @param task_id: ID of the task to approve
    pub fn approve_task(&mut self, task_id: U256) -> Result<(), Vec<u8>> {
        let caller = self.vm().msg_sender();

        // Check if task exists
        if task_id > self.task_count.get() || task_id == U256::ZERO {
            return Err(b"Task does not exist".to_vec());
        }

        let mut task = self.tasks.setter(task_id);

        // Check if caller is the task creator
        if task.creator.get() != caller {
            return Err(b"Only task creator can approve".to_vec());
        }

        let current_status = TaskStatus::from(task.status.get());

        // Check task status
        if current_status != TaskStatus::Submitted {
            return Err(b"Task has not been submitted".to_vec());
        }

        let completer = task.completer.get();
        let bounty = task.bounty.get();

        // Update task status to approved
        task.status.set(U8::from(TaskStatus::Approved as u8));

        // Transfer bounty to completer
        self.vm().transfer_eth(completer, bounty)?;

        // Emit event
        log(self.vm(), TaskApproved {
            task_id,
            completer,
            bounty,
        });

        Ok(())
    }

    /// Flag a task submission as disputed
    /// @param task_id: ID of the task to dispute
    pub fn dispute_task(&mut self, task_id: U256) -> Result<(), Vec<u8>> {
        let caller = self.vm().msg_sender();

        // Check if task exists
        if task_id > self.task_count.get() || task_id == U256::ZERO {
            return Err(b"Task does not exist".to_vec());
        }

        let mut task = self.tasks.setter(task_id);

        // Check if caller is the task creator
        if task.creator.get() != caller {
            return Err(b"Only task creator can dispute".to_vec());
        }

        let current_status = TaskStatus::from(task.status.get());

        // Check task status
        if current_status != TaskStatus::Submitted {
            return Err(b"Task has not been submitted".to_vec());
        }

        // Update task status to disputed
        task.status.set(U8::from(TaskStatus::Disputed as u8));

        // Emit event
        log(self.vm(), TaskDisputed {
            task_id,
            creator: caller,
        });

        Ok(())
    }

    /// Withdraw bounty for uncompleted or disputed tasks
    /// @param task_id: ID of the task to withdraw from
    pub fn withdraw(&mut self, task_id: U256) -> Result<(), Vec<u8>> {
        let caller = self.vm().msg_sender();

        // Check if task exists
        if task_id > self.task_count.get() || task_id == U256::ZERO {
            return Err(b"Task does not exist".to_vec());
        }

        let mut task = self.tasks.setter(task_id);

        // Check if caller is the task creator
        if task.creator.get() != caller {
            return Err(b"Only task creator can withdraw".to_vec());
        }

        let current_status = TaskStatus::from(task.status.get());
        let bounty = task.bounty.get();

        // Check if withdrawal is allowed (task is Open or Disputed)
        if current_status != TaskStatus::Open && current_status != TaskStatus::Disputed {
            return Err(b"Cannot withdraw from this task status".to_vec());
        }

        // Prevent double withdrawal
        if bounty == U256::ZERO {
            return Err(b"Bounty already withdrawn".to_vec());
        }

        // Clear bounty to prevent re-entrance
        task.bounty.set(U256::ZERO);

        // Transfer bounty back to creator
        self.vm().transfer_eth(caller, bounty)?;

        // Emit event
        log(self.vm(), TaskWithdrawn {
            task_id,
            creator: caller,
            bounty,
        });

        Ok(())
    }

    /// Get task details by ID
    /// @param task_id: ID of the task to retrieve
    pub fn get_task(&self, task_id: U256) -> Result<(Address, U256, String, u8, Address, String), Vec<u8>> {
        // Check if task exists
        if task_id > self.task_count.get() || task_id == U256::ZERO {
            return Err(b"Task does not exist".to_vec());
        }

        let task = self.tasks.getter(task_id);

        Ok((
            task.creator.get(),
            task.bounty.get(),
            task.description.get_string(),
            task.status.get().to::<u8>(),
            task.completer.get(),
            task.submission.get_string(),
        ))
    }

    /// Get total number of tasks created
    pub fn get_task_count(&self) -> U256 {
        self.task_count.get()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use stylus_sdk::testing::*;

    // Helper function to create a test setup
    fn setup_test() -> (TestVM, TaskMarketplace) {
        let vm = TestVM::default();
        let contract = TaskMarketplace::from(&vm);
        (vm, contract)
    }

    // =================
    // CREATE_TASK TESTS
    // =================

    #[test]
    fn test_create_task_success() {
        let (vm, mut contract) = setup_test();

        vm.set_value(U256::from(1000));
        let result = contract.create_task("Design a logo".to_string());

        assert!(result.is_ok());
        assert_eq!(result.unwrap(), U256::from(1));
        assert_eq!(contract.get_task_count(), U256::from(1));

        // Verify task details
        let task = contract.get_task(U256::from(1)).unwrap();
        assert_eq!(task.0, vm.msg_sender()); // creator
        assert_eq!(task.1, U256::from(1000)); // bounty
        assert_eq!(task.2, "Design a logo"); // description
        assert_eq!(task.3, TaskStatus::Open as u8); // status
        assert_eq!(task.4, Address::ZERO); // completer
        assert_eq!(task.5, ""); // submission
    }

    #[test]
    fn test_create_task_zero_bounty() {
        let (vm, mut contract) = setup_test();

        vm.set_value(U256::ZERO);
        let result = contract.create_task("Design a logo".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Bounty must be greater than zero");
    }

    #[test]
    fn test_create_task_empty_description() {
        let (vm, mut contract) = setup_test();

        vm.set_value(U256::from(1000));
        let result = contract.create_task("".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Description cannot be empty");
    }

    #[test]
    fn test_create_task_description_too_long() {
        let (vm, mut contract) = setup_test();

        vm.set_value(U256::from(1000));
        let long_description = "a".repeat(257); // 257 characters
        let result = contract.create_task(long_description);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Description too long (max 256 chars)");
    }

    #[test]
    fn test_create_multiple_tasks() {
        let (vm, mut contract) = setup_test();

        // Create first task
        vm.set_value(U256::from(1000));
        let task1 = contract.create_task("Task 1".to_string()).unwrap();

        // Create second task
        vm.set_value(U256::from(2000));
        let task2 = contract.create_task("Task 2".to_string()).unwrap();

        assert_eq!(task1, U256::from(1));
        assert_eq!(task2, U256::from(2));
        assert_eq!(contract.get_task_count(), U256::from(2));
    }

    // =================
    // SUBMIT_TASK TESTS
    // =================

    #[test]
    fn test_submit_task_success() {
        let (vm, mut contract) = setup_test();

        // Create task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // Switch to different user and submit
        vm.set_caller(Address::from([1u8; 20]));
        let result = contract.submit_task(task_id, "Logo design completed".to_string());

        assert!(result.is_ok());

        // Verify task was updated
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Submitted as u8);
        assert_eq!(task.4, Address::from([1u8; 20])); // completer
        assert_eq!(task.5, "Logo design completed"); // submission
    }

    #[test]
    fn test_submit_task_nonexistent() {
        let (vm, mut contract) = setup_test();

        vm.set_caller(Address::from([1u8; 20]));
        let result = contract.submit_task(U256::from(999), "Submission".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task does not exist");
    }

    #[test]
    fn test_submit_task_empty_submission() {
        let (vm, mut contract) = setup_test();

        // Create task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // Try to submit empty submission
        vm.set_caller(Address::from([1u8; 20]));
        let result = contract.submit_task(task_id, "".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Submission cannot be empty");
    }

    #[test]
    fn test_submit_task_submission_too_long() {
        let (vm, mut contract) = setup_test();

        // Create task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // Try to submit too long submission
        vm.set_caller(Address::from([1u8; 20]));
        let long_submission = "a".repeat(513); // 513 characters
        let result = contract.submit_task(task_id, long_submission);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Submission too long (max 512 chars)");
    }

    #[test]
    fn test_submit_task_creator_cannot_submit() {
        let (vm, mut contract) = setup_test();

        // Create task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // Creator tries to submit to their own task
        let result = contract.submit_task(task_id, "My submission".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Creator cannot submit to their own task");
    }

    #[test]
    fn test_submit_task_already_submitted() {
        let (vm, mut contract) = setup_test();

        // Create and submit task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(Address::from([1u8; 20]));
        contract.submit_task(task_id, "First submission".to_string()).unwrap();

        // Try to submit again
        vm.set_caller(Address::from([2u8; 20]));
        let result = contract.submit_task(task_id, "Second submission".to_string());

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task is not open for submissions");
    }

    // =================
    // APPROVE_TASK TESTS
    // =================

    #[test]
    fn test_approve_task_success() {
        let (vm, mut contract) = setup_test();

        let creator = Address::from([2u8; 20]);
        let completer = Address::from([3u8; 20]);

        // Create and submit task
        vm.set_caller(creator);
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(completer);
        contract.submit_task(task_id, "Logo completed".to_string()).unwrap();

        // Approve task
        vm.set_caller(creator);
        let result = contract.approve_task(task_id);

        assert!(result.is_ok());

        // Verify task status
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Approved as u8);
    }

    #[test]
    fn test_approve_task_nonexistent() {
        let (vm, mut contract) = setup_test();

        let result = contract.approve_task(U256::from(999));

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task does not exist");
    }

    #[test]
    fn test_approve_task_not_creator() {
        let (vm, mut contract) = setup_test();

        // Create and submit task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(Address::from([1u8; 20]));
        contract.submit_task(task_id, "Logo completed".to_string()).unwrap();

        // Different user tries to approve
        vm.set_caller(Address::from([2u8; 20]));
        let result = contract.approve_task(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Only task creator can approve");
    }

    #[test]
    fn test_approve_task_not_submitted() {
        let (vm, mut contract) = setup_test();

        // Create task but don't submit
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        let result = contract.approve_task(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task has not been submitted");
    }

    // =================
    // DISPUTE_TASK TESTS
    // =================

    #[test]
    fn test_dispute_task_success() {
        let (vm, mut contract) = setup_test();

        let creator = Address::from([2u8; 20]);
        let completer = Address::from([3u8; 20]);

        // Create and submit task
        vm.set_caller(creator);
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(completer);
        contract.submit_task(task_id, "Bad logo".to_string()).unwrap();

        // Dispute task
        vm.set_caller(creator);
        let result = contract.dispute_task(task_id);

        assert!(result.is_ok());

        // Verify task status
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Disputed as u8);
    }

    #[test]
    fn test_dispute_task_not_creator() {
        let (vm, mut contract) = setup_test();

        // Create and submit task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(Address::from([1u8; 20]));
        contract.submit_task(task_id, "Logo completed".to_string()).unwrap();

        // Different user tries to dispute
        vm.set_caller(Address::from([2u8; 20]));
        let result = contract.dispute_task(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Only task creator can dispute");
    }

    #[test]
    fn test_dispute_task_not_submitted() {
        let (vm, mut contract) = setup_test();

        // Create task but don't submit
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        let result = contract.dispute_task(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task has not been submitted");
    }

    // =================
    // WITHDRAW TESTS
    // =================

    #[test]
    fn test_withdraw_open_task() {
        let (vm, mut contract) = setup_test();

        // Create task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        let result = contract.withdraw(task_id);

        assert!(result.is_ok());

        // Verify bounty was cleared
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.1, U256::ZERO); // bounty should be zero
    }

    #[test]
    fn test_withdraw_disputed_task() {
        let (vm, mut contract) = setup_test();

        let creator = Address::from([2u8; 20]);
        let completer = Address::from([3u8; 20]);

        // Create, submit, and dispute task
        vm.set_caller(creator);
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(completer);
        contract.submit_task(task_id, "Bad work".to_string()).unwrap();

        vm.set_caller(creator);
        contract.dispute_task(task_id).unwrap();

        // Withdraw from disputed task
        let result = contract.withdraw(task_id);

        assert!(result.is_ok());

        // Verify bounty was cleared
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.1, U256::ZERO);
    }

    #[test]
    fn test_withdraw_not_creator() {
        let (vm, mut contract) = setup_test();

        // Create task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // Different user tries to withdraw
        vm.set_caller(Address::from([1u8; 20]));
        let result = contract.withdraw(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Only task creator can withdraw");
    }

    #[test]
    fn test_withdraw_submitted_task() {
        let (vm, mut contract) = setup_test();

        // Create and submit task
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(Address::from([1u8; 20]));
        contract.submit_task(task_id, "Logo completed".to_string()).unwrap();

        // Creator tries to withdraw from submitted task
        vm.set_caller(vm.msg_sender()); // Reset to original caller
        let result = contract.withdraw(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Cannot withdraw from this task status");
    }

    #[test]
    fn test_withdraw_approved_task() {
        let (vm, mut contract) = setup_test();

        let creator = Address::from([2u8; 20]);
        let completer = Address::from([3u8; 20]);

        // Create, submit, and approve task
        vm.set_caller(creator);
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        vm.set_caller(completer);
        contract.submit_task(task_id, "Logo completed".to_string()).unwrap();

        vm.set_caller(creator);
        contract.approve_task(task_id).unwrap();

        // Try to withdraw from approved task
        let result = contract.withdraw(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Cannot withdraw from this task status");
    }

    #[test]
    fn test_withdraw_already_withdrawn() {
        let (vm, mut contract) = setup_test();

        // Create task and withdraw
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();
        contract.withdraw(task_id).unwrap();

        // Try to withdraw again
        let result = contract.withdraw(task_id);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Bounty already withdrawn");
    }

    // =================
    // VIEW FUNCTION TESTS
    // =================

    #[test]
    fn test_get_task_nonexistent() {
        let (_vm, contract) = setup_test();

        let result = contract.get_task(U256::from(999));

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task does not exist");
    }

    #[test]
    fn test_get_task_zero_id() {
        let (_vm, contract) = setup_test();

        let result = contract.get_task(U256::ZERO);

        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), b"Task does not exist");
    }

    #[test]
    fn test_get_task_count_initial() {
        let (_vm, contract) = setup_test();

        assert_eq!(contract.get_task_count(), U256::ZERO);
    }

    // =================
    // INTEGRATION TESTS
    // =================

    #[test]
    fn test_complete_task_lifecycle_approve() {
        let (vm, mut contract) = setup_test();

        let creator = Address::from([2u8; 20]);
        let completer = Address::from([3u8; 20]);

        // 1. Create task
        vm.set_caller(creator);
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // Verify initial state
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Open as u8);
        assert_eq!(task.1, U256::from(1000));

        // 2. Submit task
        vm.set_caller(completer);
        contract.submit_task(task_id, "Logo completed".to_string()).unwrap();

        // Verify submitted state
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Submitted as u8);
        assert_eq!(task.4, completer);

        // 3. Approve task
        vm.set_caller(creator);
        contract.approve_task(task_id).unwrap();

        // Verify approved state
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Approved as u8);
    }

    #[test]
    fn test_complete_task_lifecycle_dispute() {
        let (vm, mut contract) = setup_test();

        let creator = Address::from([2u8; 20]);
        let completer = Address::from([3u8; 20]);

        // 1. Create task
        vm.set_caller(creator);
        vm.set_value(U256::from(1000));
        let task_id = contract.create_task("Design a logo".to_string()).unwrap();

        // 2. Submit task
        vm.set_caller(completer);
        contract.submit_task(task_id, "Poor quality logo".to_string()).unwrap();

        // 3. Dispute task
        vm.set_caller(creator);
        contract.dispute_task(task_id).unwrap();

        // Verify disputed state
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.3, TaskStatus::Disputed as u8);

        // 4. Withdraw from disputed task
        contract.withdraw(task_id).unwrap();

        // Verify withdrawal
        let task = contract.get_task(task_id).unwrap();
        assert_eq!(task.1, U256::ZERO); // bounty cleared
    }

    #[test]
    fn test_multiple_users_multiple_tasks() {
        let (vm, mut contract) = setup_test();

        let user1 = Address::from([1u8; 20]);
        let user2 = Address::from([2u8; 20]);
        let user3 = Address::from([3u8; 20]);

        // User1 creates task1
        vm.set_caller(user1);
        vm.set_value(U256::from(1000));
        let task1 = contract.create_task("Task 1".to_string()).unwrap();

        // User2 creates task2
        vm.set_caller(user2);
        vm.set_value(U256::from(2000));
        let task2 = contract.create_task("Task 2".to_string()).unwrap();

        // User3 submits to both tasks
        vm.set_caller(user3);
        contract.submit_task(task1, "Submission for task 1".to_string()).unwrap();
        contract.submit_task(task2, "Submission for task 2".to_string()).unwrap();

        // User1 approves task1
        vm.set_caller(user1);
        contract.approve_task(task1).unwrap();

        // User2 disputes task2
        vm.set_caller(user2);
        contract.dispute_task(task2).unwrap();

        // Verify final states
        let task1_final = contract.get_task(task1).unwrap();
        let task2_final = contract.get_task(task2).unwrap();

        assert_eq!(task1_final.3, TaskStatus::Approved as u8);
        assert_eq!(task2_final.3, TaskStatus::Disputed as u8);
        assert_eq!(contract.get_task_count(), U256::from(2));
    }
}