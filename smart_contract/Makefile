-include .env
export

deploy_local:
	@echo "deploying locally!"
	@cargo stylus deploy -e $(RPC) --no-verify --private-key $(PRIVATE_KEY)

abi:
	@echo "writting to a file ..."
	@cargo stylus export-abi --json --output gig1.json

check:
	@echo "checking the contract"
	@cargo stylus check
