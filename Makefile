frontend:
	cd solid-src; \
		pnpm build

build: frontend
	neu build

release: frontend
	neu build --clean -r --embed-resources

