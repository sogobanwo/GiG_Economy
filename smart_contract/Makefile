-include .env
export
# 0x525c2aba45f66987217323e8a05ea400c65d06dc
deploy_local:
	@echo "deploying locally!"
	@cargo stylus deploy -e $(RPC) --no-verify --private-key $(PRIVATE_KEY)

abi:
	@echo "writting to a file ..."
	@cargo stylus export-abi --json --output gig1.json

check:
	@echo "checking the contract"
	@cargo stylus check

deploy_testnet:
	@echo "deploying locally!"
	@cargo stylus deploy -e $(RPC_TESTNET) --no-verify --private-key $(PRIVATE_KEY_TEST)

verify_testnet:
	@echo "verifying the contract"
	@cargo stylus verify --deployment-tx $(TX_HASH) -e $(RPC_TESTNET)
