import { eco } from '@ecopages/core';
import { BaseLayout } from '@/layouts/base-layout/base-layout.kita';

export default eco.page({
	dependencies: {
		stylesheets: ['./index.css'],
		scripts: ['./on-view.script.ts'],
		components: [BaseLayout],
	},
	layout: BaseLayout,
	render: () => {
		return (
			<div class="showcase">
				<section class="group flex flex-col items-center justify-center py-40 text-center max-w-7xl mx-auto">
					<h1 class="text-3xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white mb-8 leading-[0.95] select-none">
						Orchestrate scripts.
						<br />
						<scripts-injector scripts="/scripts/accelerate.script.js" on:idle>
							<span class="text-brand-primary accelerate-word">Accelerate your page.</span>
						</scripts-injector>
					</h1>
					<p class="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed mb-12 font-medium">
						Take full control of your scripts with a declarative approach.
						<br class="hidden md:block" /> Inject what you need, exactly when and where you need it.
					</p>
					<div class="flex flex-col sm:flex-row gap-4 items-center justify-center w-full sm:w-auto mt-8">
						<a href="/docs" class="btn btn-primary text-base w-full sm:w-auto">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 2 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
							Documentation
						</a>
						<a
							href="https://github.com/ecopages/scripts-injector"
							class="btn btn-secondary text-base w-full sm:w-auto"
						>
							<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
							GitHub
						</a>
					</div>
				</section>

				<div id="examples" class="space-y-32">
					{' '}
					{/* Spacing between examples */}
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Lazy Interaction (Click)</h2>
							<p class="section-desc">
								Delays loading of heavy logic until the user actually clicks. The click event is
								captured, the script loads, and then the click is replayed natively.
							</p>
							<span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:interaction="click"
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-75">
								<div class="text-center">
									<scripts-injector scripts="/scripts/demo-click.js" on:interaction="click">
										<button id="demo-click-btn" class="btn btn-primary w-full justify-center">
											Click to Launch
										</button>
									</scripts-injector>
									<div id="demo-click-log" class="mt-4 text-sm font-mono text-green-600 h-6"></div>
								</div>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Anticipation (Hover)</h2>
							<p class="section-desc">
								Preloads resources when a user hovers, ensuring instant availability without waiting for
								a click. Ideal for menus or tooltips.
							</p>
							<span class="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:interaction="mouseenter"
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-[300px]">
								<scripts-injector
									scripts="/scripts/demo-hover.js"
									on:interaction="mouseenter"
									class="w-full max-w-md"
								>
									<div
										id="demo-hover-area"
										class="h-32 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium cursor-pointer hover:border-purple-500 hover:text-purple-500 transition-all"
									>
										Hover me to load
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Input Focus</h2>
							<p class="section-desc">
								Load validation libraries, date pickers, or input masks only when the user focuses on a
								specific field.
							</p>
							<span class="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:interaction="focusin"
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-[300px]">
								<div class="w-full max-w-md">
									<label class="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">
										Search
									</label>
									<scripts-injector scripts="/scripts/demo-focus.js" on:interaction="focusin">
										<input
											id="demo-focus-input"
											type="text"
											placeholder="Click or Tab to focus..."
											class="input-field"
										/>
									</scripts-injector>
								</div>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Background (Idle)</h2>
							<p class="section-desc">
								Non-critical resources like analytics or logging can be loaded when the browser is idle,
								preventing main-thread blocking during initial load.
							</p>
							<span class="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:idle
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-[300px]">
								<scripts-injector scripts="/scripts/demo-idle.js" on:idle>
									<div
										id="demo-idle-badge"
										class="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 rounded-full font-bold transition-all duration-700 animate-pulse"
									>
										Waiting for Idle...
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Form Interception</h2>
							<p class="section-desc">
								Inject validation or submission logic exactly when the user attempts to submit a form.
							</p>
							<span class="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:interaction="submit"
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-[300px]">
								<scripts-injector
									scripts="/scripts/demo-form.js"
									on:interaction="submit"
									class="w-full max-w-sm"
								>
									<form id="demo-form" class="space-y-4" onsubmit="return false">
										<h3 class="font-bold text-gray-900 dark:text-white mt-0">Newsletter</h3>
										<input
											type="email"
											name="email"
											placeholder="you@example.com"
											class="input-field"
											required
										/>
										<button type="submit" class="btn btn-primary w-full justify-center mt-3">
											Subscribe
										</button>
										<div id="demo-form-feedback" class="h-4"></div>
									</form>
								</scripts-injector>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Dynamic Selection</h2>
							<p class="section-desc">Load dependent logic based on user choices from a dropdown menu.</p>
							<span class="inline-block bg-cyan-100 text-cyan-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:interaction="change"
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-[300px]">
								<div class="w-full max-w-xs">
									<scripts-injector
										scripts="/scripts/demo-select.js"
										on:interaction="change"
										class="w-full"
									>
										<select id="demo-select" class="select-field" aria-label="Demo Selection">
											<option value="">Select an option...</option>
											<option value="A">Feature A</option>
											<option value="B">Feature B</option>
											<option value="C">Feature C</option>
										</select>
									</scripts-injector>
									<div
										id="demo-select-feedback"
										class="mt-4 text-center h-4 font-bold text-cyan-600"
									></div>
								</div>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Nested Composition</h2>
							<p class="section-desc">
								Injectors can be nested within each other. Parent and child loading logic remains
								independent.
							</p>
							<span class="inline-block bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								Nested Components
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12 min-h-[300px]">
								<scripts-injector
									scripts="/scripts/demo-nested-parent.js"
									on:interaction="mouseenter"
									class="contents"
								>
									<div
										id="demo-nested-parent"
										class="p-10 border-2 border-dashed border-indigo-200 rounded-xl relative bg-white dark:bg-black transition-all w-full"
									>
										<span class="absolute top-0 right-0 bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-1 rounded-bl-lg uppercase tracking-wider">
											Parent (Hover)
										</span>

										<div class="mt-8 flex justify-center">
											<scripts-injector
												scripts="/scripts/demo-nested-child.js"
												on:interaction="click"
											>
												<button id="demo-nested-child" class="btn btn-primary">
													Child Button (Click)
												</button>
											</scripts-injector>
										</div>
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>
					<section class="showcase-section">
						<div class="showcase-info">
							<h2 class="section-title">Margin Visibility</h2>
							<p class="section-desc">
								Preload scripts <em>before</em> content enters the viewport to ensure zero CLS or delay
								when the user arrives.
							</p>
							<span class="inline-block bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded mt-2">
								on:visible="200px"
							</span>
						</div>
						<div class="showcase-demo">
							<div class="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl p-12">
								<div class="text-sm text-gray-500 dark:text-gray-400 mb-8 italic">
									Scroll container (simulated)
								</div>
								<div class="h-32"></div> {/* Spacer */}
								<scripts-injector
									scripts="/scripts/demo-margin.js"
									on:visible="200px"
									class="w-full max-w-lg"
								>
									<div
										id="demo-margin-box"
										class="h-40 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold flex items-center justify-center rounded-lg shadow-inner transition-all border-2 border-transparent w-full"
									>
										I load at 200px offset
									</div>
								</scripts-injector>
							</div>
						</div>
					</section>
				</div>

				<footer class="mt-32 border-t border-gray-100 dark:border-gray-800 py-12 text-center text-gray-500 dark:text-gray-400">
					<p class="mb-4">
						Built with{' '}
						<a
							href="https://github.com/ecopages/ecopages"
							class="text-brand-primary hover:underline font-medium"
							aria-label="Ecopages Repository"
						>
							Ecopages
						</a>
					</p>
					<div class="flex gap-6 justify-center text-sm">
						<a
							href="https://github.com/ecopages"
							class="hover:text-gray-900 dark:hover:text-white transition-colors"
							aria-label="Ecopages Organization"
						>
							@ecopages
						</a>
						<a
							href="https://github.com/andeeplus"
							class="hover:text-gray-900 dark:hover:text-white transition-colors"
						>
							@andeeplus
						</a>
					</div>
				</footer>
			</div>
		);
	},
});
