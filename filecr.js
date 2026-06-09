(function () {
	const versionInfo = {
		id: 'ddgilliopjknmglnpkegbjpoilgachlm',
		version: '9.9.9',
	};

	// 1. Inject custom premium minimal full-width CSS
	const css = `
		#filecr-bypass-trigger {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			background: #10b981;
			color: #ffffff !important;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 14px;
			font-weight: 600;
			padding: 12px 20px;
			border-radius: 6px;
			text-decoration: none !important;
			cursor: pointer;
			transition: all 0.2s ease;
			margin-top: 15px;
			border: none;
			outline: none;
			width: 100%;
			box-sizing: border-box;
			box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
		}
		#filecr-bypass-trigger:hover {
			background: #059669;
			box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
		}
		#filecr-bypass-trigger:active {
			transform: scale(0.98);
		}
		#filecr-bypass-container {
			background: #0f172a;
			border: 1px solid #1e293b;
			border-radius: 8px;
			padding: 14px;
			margin-top: 12px;
			display: flex;
			flex-direction: column;
			gap: 10px;
			width: 100%;
			box-sizing: border-box;
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
			animation: filecrBypassFadeIn 0.2s ease-out;
		}
		@keyframes filecrBypassFadeIn {
			from {
				opacity: 0;
				transform: translateY(-5px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
		.filecr-bypass-link {
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: #1e293b;
			border: 1px solid #334155;
			border-radius: 6px;
			padding: 12px 16px;
			color: #f1f5f9 !important;
			text-decoration: none !important;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 13px;
			font-weight: 600;
			width: 100%;
			box-sizing: border-box;
			transition: all 0.15s ease;
		}
		.filecr-bypass-link:hover {
			background: #0f172a;
			border-color: #10b981;
			color: #10b981 !important;
			padding-left: 20px;
		}
		.filecr-bypass-link-type {
			font-size: 10px;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			background: #334155;
			padding: 2px 6px;
			border-radius: 4px;
			color: #94a3b8;
			font-weight: 600;
		}
		.filecr-bypass-link:hover .filecr-bypass-link-type {
			background: rgba(16, 185, 129, 0.15);
			color: #10b981;
		}
		.filecr-bypass-empty {
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			font-size: 13px;
			color: #64748b;
			text-align: center;
			padding: 10px;
		}
	`;
	
	const style = document.createElement('style');
	style.textContent = css;
	document.documentElement.appendChild(style);

	// 2. Set cookie at document start
	if (!document.cookie.includes('extensionIsInstalled')) {
		document.cookie = 'extensionIsInstalled=true; path=/; domain=.filecr.com; expires=Fri, 01 Jan 2077 00:00:00 GMT';
		document.cookie = 'extensionIsInstalled=true; path=/; expires=Fri, 01 Jan 2077 00:00:00 GMT';
	}

	// 3. Mock message listener
	window.addEventListener(
		'message',
		event => {
			if (!event.data || !event.data.id) return;

			const data = {
				direction: 'from-content-script',
				responseFor: event.data.id,
				type: 'response',
			};

			if (event.data.id === 'install-check') {
				data.data = null;
				window.postMessage(data, '*');
				return;
			}

			switch (event.data.action) {
				case 'app.info': {
					data.data = versionInfo;
					break;
				}

				case 'downloads.extractLink': {
					data.data = event.data.data.url;
					break;
				}

				case 'favorites.has': {
					data.data = false;
					break;
				}

				default: {
					return;
				}
			}

			window.postMessage(data, '*');
		},
	);

	// 4. Fetch internal / torrent download link
	async function getLinks(meta) {
		return fetch(`/api/actions/downloadlink/?id=${meta.id}`)
			.then(data => data.json())
			.then(json => ({provider: meta.type, url: json.url}));
	}

	// 5. Inject download UI (Internal and Torrent links only)
	async function displayLinks(json) {
		if (document.querySelector('#filecr-bypass-container')) {
			return;
		}

		const trigger = document.querySelector('#filecr-bypass-trigger');
		const downloadInfo = document.querySelector('.download-info');
		if (!downloadInfo) return;

		const container = document.createElement('div');
		container.id = 'filecr-bypass-container';
		downloadInfo.append(container);

		if (trigger) trigger.innerHTML = 'LOADING LINKS...';

		try {
			const downloads = json.props.pageProps.post.downloads;
			if (downloads && downloads.length > 0 && downloads[0].links) {
				// Filter to only include Internal and Torrent link types
				const linksMeta = downloads[0].links.filter(meta => 
					['Torrent', 'Internal'].includes(meta.type)
				);
				
				if (linksMeta.length > 0) {
					const downloadLinks = await Promise.all(linksMeta.map(meta => getLinks(meta)));
					
					for (const [i, link] of downloadLinks.entries()) {
						const a = document.createElement('a');
						a.href = link.url;
						a.classList.add('filecr-bypass-link');
						a.innerHTML = `
							<span>⬇️ Download Link ${i + 1}</span>
							<span class="filecr-bypass-link-type">${link.provider === 'Internal' ? 'Direct' : 'Torrent'}</span>
						`;
						container.append(a);
					}
					if (trigger) trigger.innerHTML = 'DOWNLOAD LINKS ACQUIRED!';
				} else {
					const emptyDiv = document.createElement('div');
					emptyDiv.classList.add('filecr-bypass-empty');
					emptyDiv.innerText = 'No Direct or Torrent links found.';
					container.append(emptyDiv);
					if (trigger) trigger.innerHTML = 'NO LINKS AVAILABLE';
				}
			} else {
				if (trigger) trigger.innerHTML = 'NO DOWNLOAD DATA FOUND';
			}
		} catch (err) {
			console.error('Bypass error:', err);
			if (trigger) trigger.innerHTML = 'ERROR ACQUIRING LINKS';
		}
	}

	let reloaded = false;
	function addTrigger() {
		if (document.querySelector('.e-404') && !reloaded) {
			reloaded = true;
			window.location.reload();
			return;
		}

		const downloadInfo = document.querySelector('.download-info');
		if (!downloadInfo || document.querySelector('#filecr-bypass-trigger')) {
			return;
		}

		const nextDataEl = document.querySelector('#__NEXT_DATA__');
		if (!nextDataEl) return;

		let rawJSON;
		try {
			rawJSON = JSON.parse(nextDataEl.textContent);
		} catch (e) {
			return;
		}

		const a = document.createElement('button');
		a.id = 'filecr-bypass-trigger';
		a.innerHTML = '🚀 GET DOWNLOAD LINKS';

		const postSlug = rawJSON.query ? rawJSON.query.postSlug : null;
		if (postSlug && window.location.pathname.includes(postSlug)) {
			a.addEventListener('click', (e) => {
				e.preventDefault();
				displayLinks(rawJSON);
			});
		} else {
			a.addEventListener('click', (e) => {
				e.preventDefault();
				window.location.reload();
			});
			a.innerHTML += '<br>(Data mismatch. Reload required.)';
		}

		downloadInfo.append(a);
	}

	// 6. Init trigger on DOM load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => {
			addTrigger();
			observeDOM();
		});
	} else {
		addTrigger();
		observeDOM();
	}

	function observeDOM() {
		const observer = new MutationObserver(() => addTrigger());
		observer.observe(document.documentElement, { childList: true, subtree: true });
	}

	// 7. Navigation changes
	if (window.onurlchange === null) {
		window.addEventListener('urlchange', () => addTrigger());
	}
})();
