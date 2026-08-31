%global debug_package %{nil}
%global __strip /bin/true

Name:		vencoder
Version:	0.1.3
Release:        %autorelease
Summary:	A wrapper around FFmpeg for mass transcoding video files

License:	GPL-3.0-or-later
URL:		https://github.com/lines-of-codes/Vencoder
Source0:	%{name}-%{version}.tar.gz

BuildRequires:	nodejs24
BuildRequires:	make
Requires:	gtk3
Requires:	webkit2gtk4.1
Suggests:	ffmpeg-free

%description
A tool to interactively mass transcode videos using FFmpeg

%prep
%setup -n %{name}-%{version}


%build
curl -fsSL https://get.pnpm.io/install.sh | env PNPM_VERSION=10.25.0 sh -
source ~/.bashrc
pnpm i -g @neutralinojs/neu
cd solid-src
pnpm i
cd ..
neu update
make release


%install
install -d "%{buildroot}%{_bindir}" "%{buildroot}%{_datadir}/applications"
install "./meta/xyz.dailitation.linesofcodes.vencoder.desktop" "%{buildroot}%{_datadir}/applications/xyz.dailitation.linesofcodes.vencoder.desktop"

%ifarch x86_64
	install "./dist/vencoder/vencoder-linux_x64" "%{buildroot}%{_bindir}/vencoder"
%elifarch aarch64
	install "./dist/vencoder/vencoder-linux_arm64" "%{buildroot}%{_bindir}/vencoder"
%endif

%check


%files
%license LICENSE
%{_bindir}/vencoder
%{_datadir}/applications/xyz.dailitation.linesofcodes.vencoder.desktop


%changelog
* Mon Aug 31 2026 Satakun Utama <linesofcodes@dailitation.xyz> 0.1.3-1
- new package built with tito

%autochangelog
