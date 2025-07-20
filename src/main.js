/*
 * Luminosity
 * A simple framework to create web apps
 *
 * @version 0.0.1
 * @author CrazyH2
 * @license Attribution-NonCommercial-NoDerivatives 4.0 International
 * @copyright 2025 CrazyH2
 */



// Purity.js
// Constants
const PURITY_KEYWORD = "purity";
const DATA_PURITY_FLAG = `data-${PURITY_KEYWORD}_flag`;
/**
 * App factory that should be invoked once to create an application state
 */
const init = (initialState) => {
	const state = initialState;
	/**
	 * Parses an html string and returns so called 'nodeMap' which represents the virtual DOM
	 */
	const buildNodesMap = (html) => {
		const virtualDocument = new DOMParser().parseFromString(html, "text/html");
		const nodesMap = new Map();
		for (const node of virtualDocument.querySelectorAll("[id]")) {
			const shallow = node.cloneNode(true);
			for (const innerNode of shallow.querySelectorAll("[id]")) {
				innerNode.outerHTML = `<!-- ${innerNode.tagName}#${innerNode.id} -->`;
			}
			// Removing the `data-purity_*` attributes attached in render() function
			// TODO: try to avoid the situation when we have to remove something added in another module.
			for (const innerNode of shallow.querySelectorAll(`[${DATA_PURITY_FLAG}]`)) {
				for (const key in innerNode.dataset) {
					if (key.startsWith(PURITY_KEYWORD)) {
						innerNode.removeAttribute(`data-${key}`);
					}
				}
			}
			nodesMap.set(node.id, { node, shallow });
		}
		return nodesMap;
	};
	let rootComponent;
	let domNodesMap;
	/**
	 * Mounts an App to DOM
	 */
	function mount(f) {
		// Setting up rootComponent
		rootComponent = () => buildNodesMap(f());
		domNodesMap = rootComponent();
		// Top-level component should always have an id equal to a root element's id
		const rootId = domNodesMap.keys().next().value;
		const root = document.getElementById(rootId);
		const rootNode = domNodesMap.get(rootId)?.node;
		if (root && rootNode) {
			root.replaceWith(rootNode);
		}
		else {
			throw new Error(`Root DOM element's id does not correspond to the defined application root id "${rootId}".`);
		}
	}
	/**
	 * Updates element's attributes from current state to one specified in newNode
	 */
	function updateAttributes(element, newNode) {
		for (const { name } of element.attributes) {
			element.removeAttribute(name);
		}
		for (const { name, value } of newNode.node.attributes) {
			element.setAttribute(name, value);
		}
	}
	/**
	 * Forces html re-rendering with the current state
	 */
	function rerender() {
		const newNodesMap = rootComponent();
		console.warn("🌀");
		for (const [id, domNode] of domNodesMap) {
			const newNode = newNodesMap.get(id);
			// Since we depend on the shallow comparison, we must only care about updating changed nodes.
			if (newNode && domNode.shallow.outerHTML !== newNode.shallow.outerHTML) {
				const elementById = document.getElementById(id);
				if (elementById) {
					updateAttributes(elementById, newNode);
					if (domNode.shallow.innerHTML !== newNode.shallow.innerHTML) {
						elementById.innerHTML = newNode.node.innerHTML;
						console.warn(`\t↻ #${id}`);
					}
					else {
						console.warn(`\t± #${id}`);
					}
				}
				else {
					throw new Error(`There is no element in the DOM with id "${id}".`);
				}
			}
		}
		domNodesMap = newNodesMap;
	}
	return {
		mount,
		rerender,
		getState: () => state,
		setState(callback) {
			Object.assign(state, callback(state));
			rerender();
		},
	};
};
// Patterns
const ARGS_RE = /__\[(\d+)\]__/gm;
const BOUND_EVENTS_RE = /::(\w+)\s*=\s*__\[(\d+)\]__/gm;
// Helpers
export const isTruthy = (x) => x !== undefined && x !== null && x !== false;
const clearFalsy = (x) => isTruthy(x) ? x : "";
const joinIfArray = (x) => Array.isArray(x) ? x.join("") : x;
/**
 * Increments the Purity Key and resets it after all sync operations completed
 */
const applyPurityKey = (() => {
	let purityKey = 0;
	let timeout;
	return () => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => {
			purityKey = 0;
		});
		return purityKey++;
	};
})();
/**
 * Tagged template to compute the html string from a string literal
 */
const render = ([first, ...strings], ...args) => {
	const precomputedString = strings.reduce(($, item, i) => `${$}__[${i}]__${item}`, first);
	const bindEventHandlers = (_, event, index) => {
		const dataName = `data-${PURITY_KEYWORD}_${event}_${applyPurityKey()}`;
		setTimeout(() => {
			// Asynchronously bind event handlers after rendering everything to DOM
			const element = document.querySelector(`[${dataName}]`);
			const prop = args[index];
			if (element && typeof prop === "function") {
				element[`on${event}`] = prop;
				// Remove residuals (needed for consistency)
				element.removeAttribute(dataName);
			}
		});
		return `${dataName} ${DATA_PURITY_FLAG}`;
	};
	const processArgs = (_, index) => joinIfArray(clearFalsy(args[+index]));
	const stringToRender = precomputedString
		.replace(BOUND_EVENTS_RE, bindEventHandlers)
		.replace(ARGS_RE, processArgs)
		.trim()
		.replace(/\n\s*</g, "<")
		.replace(/>\n\s*/g, ">");
	return stringToRender;
};



// Main.js
//import { init, render } from "./purity.js"

class LuminosityRouter {
	constructor() {
		this.routes = {};
		this.currentRoute = null;
		
		window.addEventListener("hashchange", this.handleLocation.bind(this));
	};

	handleLocation(event) {
		let hash = window.location.hash;
		if (!hash) return '/';
		const path = hash.substring(1).startsWith('/') ? hash.substring(2) : hash.substring(1);
		
		var route = this.routes[path];
		if (!route) route = this.routes['404'];
		
		this.currentRoute = route;
		console.log(route)
		luminosity.renderPage(route);
	};

	addRoute(route, handler) {
		this.routes[route] = handler;
	};
};

class Luminosity {
	constructor() {
		this.path = window.LuminosityPath || '/luminosity/';
		this.version = "0.0.1";
		this.pages = {};
		this.states = {};
		this.setState = () => { };
		this.getState = () => { };
		this.config = {};
		this.loading_page = null;
		this.start_page = null;
		this.error_page = null;
		this.not_found_page = null;
		this.global_css = {};
		this.init_with_states = {};
		this.current_page = null;
		this.mount = null;

		this.router = new LuminosityRouter();

		console.info(`Luminosity v${this.version} initialized`);

		this.init();
	};

	async init() {
		await this.loadConfig();
		var configOk = this.checkConfig();
		if (configOk !== true) return configOk;

		// Purity
		const { mount, getState, setState } = init(this.states);
		this.mount = mount;
		this.getState = getState;
		this.setState = setState;

		// Main
		this.setMetadata();
		await this.loadLoadingPage();
		this.renderPage(this.loading_page);
		
		await this.loadStartPage();
		await this.loadErrorPage();
		await this.loadNotFoundPage();
		
		await this.loadPages();
		
		this.loadGlobalCss();
		this.onEvents();

		this.router.handleLocation({});

		this.start();
	};

	async loadConfig() {
		try {
			const response = await fetch(`${this.path}config.json`);
			this.config = await response.json();
		} catch (error) {
			console.error('Luminosuty: Error fetching config:', error);
		};
	};

	checkConfig() {
		if (!this.config.main) return console.error("Luminosity: Missing main in config");
		if (!this.config.main.title) return console.error("Luminosity: Missing title in config");
		if (!this.config.main.description) return console.error("Luminosity: Missing description in config");
		if (!this.config.main.favicon) return console.error("Luminosity: Missing favicon in config");
		if (!this.config.main.author) return console.error("Luminosity: Missing author in config");

		if (!this.config.main.start_page) return console.error("Luminosity: Missing start_page in config");
		if (!this.config.main.loading_page) return console.error("Luminosity: Missing loading_page in config");
		if (!this.config.main.not_found_page) return console.error("Luminosity: Missing not_found_page in config");

		if (!this.config.main.on_error) return console.error("Luminosity: Missing on_error in config");
		if (!this.config.main.on_error.page) return console.error("Luminosity: Missing page in on_error");
		if (!this.config.main.on_error.info_element) return console.error("Luminosity: Missing info_element in on_error");

		if (!this.config.main.global_css) this.config.main.global_css = {};
		this.global_css = this.config.main.global_css;

		if (!this.config.main.init_with_states) this.config.main.init_with_states = {};
		this.init_with_states = this.config.main.init_with_states;

		if (!this.config.pages) return console.error("Luminosity: Missing pages in config");

		if (!this.loading_page) this.loading_page = this.config.main.loading_page;
		if (!this.start_page) this.start_page = this.config.main.start_page;
		if (!this.error_page) this.error_page = this.config.main.on_error.page;

		console.log("Luminosity: Config loaded")

		return true;
	};

	setMetadata() {
		document.title = this.config.main.title;

		let authorMeta = document.querySelector('meta[name="author"]');
		if (!authorMeta) {
			authorMeta = document.createElement('meta');
			authorMeta.setAttribute('name', 'author');
			document.head.appendChild(authorMeta);
		}
		authorMeta.setAttribute('content', this.config.main.author);

		let descriptionMeta = document.querySelector('meta[name="description"]');
		if (!descriptionMeta) {
			descriptionMeta = document.createElement('meta');
			descriptionMeta.setAttribute('name', 'description');
			document.head.appendChild(descriptionMeta);
		}
		descriptionMeta.setAttribute('content', this.config.main.description);

		let faviconLink = document.querySelector('link[rel="icon"]');
		if (!faviconLink) {
			faviconLink = document.createElement('link');
			faviconLink.setAttribute('rel', 'icon');
			document.head.appendChild(faviconLink);
		}
		faviconLink.setAttribute('href', this.config.main.favicon);

		console.log("Luminosity: Metadata set");
	};

	async loadPage(page, domVariable = false) {
		try {
			const moduleExports = await import(`${this.path}templates/${page}`);
			const defaultExport = moduleExports.default;

			if (!defaultExport) return console.error(`Luminosity: Missing default export in ${page}`);
			if (!defaultExport.getTitle && domVariable == false) return console.error(`Luminosity: Missing getTitle function in ${page}`);
			if (!defaultExport.init) return console.error(`Luminosity: Missing init function in ${page}`);
			if (!defaultExport.style) return console.error(`Luminosity: Missing style function in ${page}`);
			if (!defaultExport.render) return console.error(`Luminosity: Missing render function in ${page}`);
			if (!defaultExport.onEvent) return console.error(`Luminosity: Missing onEvent function in ${page}`);

			defaultExport.init(this.setState, this.getState, this.stateUpdate);

			const pageName = page.split('.').slice(0, -1).join('.');
			this.router.addRoute(pageName, defaultExport);

			return defaultExport;
		} catch (error) {
			console.error('Luminosity: Error fetching page:', error);
		};
	};

	async loadComponent(component) {
		try {
			const moduleExports = await import(`${this.path}components/${component}`);
			const defaultExport = moduleExports.default;

			if (!defaultExport) return console.error(`Luminosity: Missing default export in ${component}`);

			if (typeof defaultExport === 'function') {
				return await defaultExport(this.setState, this.getState, this.stateUpdate);
			};

			return defaultExport;
		} catch (error) {
			console.error('Luminosity: Error fetching component:', error);
		};
	};

	async loadPages() {
		for (const page in this.config.pages) {
			this.pages[page] = await this.loadPage(this.config.pages[page]);
		};

		console.log("Luminosity: Pages loaded");
	};

	async loadLoadingPage() {
		this.loading_page = await this.loadPage(this.config.main.loading_page);
	};

	async loadStartPage() {
		this.start_page = await this.loadPage(this.config.main.start_page);
	};

	async loadErrorPage() {
		this.error_page = await this.loadPage(this.config.main.on_error.page);
	};

	async loadNotFoundPage() {
		this.not_found_page = await this.loadPage(this.config.main.not_found_page);

		this.router.addRoute('404', () => luminosity.renderPage(this.not_found_page));
	};

	loadGlobalCss() {
		for (const [styleName, styleValue] of Object.entries(this.global_css)) {
			document.documentElement.style.setProperty(styleName, styleValue);
		};
	};

	stateUpdate() {
		this.renderPage(this.current_page);
	};

	_renderPage(page) {
		if (!this.pages[page] && this.start_page !== page && this.loading_page !== page && this.error_page !== page) {
			return console.error("Luminosity: Page not found"); 
		};

		try {
			/*if (this.current_page !== page && page !== this.loading_page) {
				this.renderPage(this.loading_page);
			};
			*/
			this.current_page = page;

			const style = page.style(this.setState, this.getState, this.stateUpdate);
			const renderedPage = page.render(render, this.setState, this.getState, this.stateUpdate, this.loadComponent);

			var styleElement = document.getElementById("luminosity-style");
			if (!styleElement) {
				styleElement = document.createElement('style');
				styleElement.id = "luminosity-style";
				document.head.appendChild(styleElement);
			} else {
				styleElement.innerHTML = style;
			};

			var pageTitle = page.getTitle(luminosity.setState, luminosity.getState, luminosity.stateUpdate);
			if (pageTitle) {
				document.title = pageTitle;
			};

			console.log("Luminosity: Page rendered");

			return renderedPage;
		} catch (error) {
			console.error('Luminosity: Error rendering page:', error);
			return render`<div id="root"><a>Error rendering page</a></div>`;
		};
	};

	renderPage(page) {
		const context = this;
		context.mount(() => context._renderPage(page));
	};


	async start() {
		var _error = console.error;
		var _onError = this.onError;
		console.error = function() {
			_onError(arguments);
			return _error.apply(console, arguments);
		};
		window.addEventListener('error', (event) => {
			this.onError(event.message);
		});

		this.renderPage(this.start_page);
		console.log("Luminosity: Started");
	};

	onEvent(type, data) {
		this.current_page.onEvent(type, data, this.setState, this.getState, this.stateUpdate);
	};

	onEvents() {
		document.addEventListener('click', (event) => this.onEvent('click', event));
		document.addEventListener('keydown', (event) => this.onEvent('keydown', event));
		document.addEventListener('keyup', (event) => this.onEvent('keyup', event));
		document.addEventListener('mousemove', (event) => this.onEvent('mousemove', event));
		document.addEventListener('mouseover', (event) => this.onEvent('mouseover', event));
		document.addEventListener('mouseout', (event) => this.onEvent('mouseout', event));
		document.addEventListener('dblclick', (event) => this.onEvent('dblclick', event));
		document.addEventListener('contextmenu', (event) => this.onEvent('contextmenu', event));
		document.addEventListener('resize', (event) => this.onEvent('resize', event));
		document.addEventListener('scroll', (event) => this.onEvent('scroll', event));
		document.addEventListener('focus', (event) => this.onEvent('focus', event));
		document.addEventListener('blur', (event) => this.onEvent('blur', event));
	};

	async onError(errorInfo) {
		await luminosity.renderPage(luminosity.error_page);
		await new Promise(r => setTimeout(r, 100))
		luminosity.setState((({ error }) => ({ error: errorInfo })));
	};
};

window.luminosity = new Luminosity();