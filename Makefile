configure:
	npm i -g corepack@latest
	corepack enable pnpm
	cd solid-src; \
		pnpm i

frontend:
	cd solid-src; \
		pnpm build

build: frontend
	neu build

release: frontend
	neu build --clean -r --embed-resources

FLATPAK_BUILDER ?= flatpak-builder

flatpak-bundle:
	flatpak build-bundle ./flatpak-repo Vencoder-Linux-x64.flatpak \
	    xyz.dailitation.linesofcodes.vencoder --runtime-repo=https://flathub.org/repo/flathub.flatpakrepo

flatpak-repo: ./meta/xyz.dailitation.linesofcodes.vencoder.yml
	${FLATPAK_BUILDER} --user --force-clean --repo=./flatpak-repo ./flatpak ./meta/xyz.dailitation.linesofcodes.vencoder.yml

flatpak-install: ./meta/xyz.dailitation.linesofcodes.vencoder.yml
	${FLATPAK_BUILDER} --user --force-clean --repo=./flatpak-repo --install ./flatpak ./meta/xyz.dailitation.linesofcodes.vencoder.yml
