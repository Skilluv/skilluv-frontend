import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
	gsap.registerPlugin(ScrollTrigger);
}

export { gsap, ScrollTrigger };

/** Svelte action: reveal element on scroll */
export function scrollReveal(
	node: HTMLElement,
	options?: { y?: number; x?: number; delay?: number; duration?: number; scale?: number }
) {
	const { y = 60, x = 0, delay = 0, duration = 0.8, scale = 1 } = options ?? {};

	gsap.set(node, { opacity: 0, y, x, scale });

	const trigger = ScrollTrigger.create({
		trigger: node,
		start: 'top 85%',
		once: true,
		onEnter: () => {
			gsap.to(node, {
				opacity: 1,
				y: 0,
				x: 0,
				scale: 1,
				duration,
				delay,
				ease: 'power3.out'
			});
		}
	});

	return {
		destroy() {
			trigger.kill();
		}
	};
}

/** Svelte action: stagger children on scroll */
export function scrollStagger(
	node: HTMLElement,
	options?: { y?: number; stagger?: number; duration?: number }
) {
	const { y = 50, stagger = 0.12, duration = 0.7 } = options ?? {};
	const children = node.children;

	gsap.set(children, { opacity: 0, y });

	const trigger = ScrollTrigger.create({
		trigger: node,
		start: 'top 80%',
		once: true,
		onEnter: () => {
			gsap.to(children, {
				opacity: 1,
				y: 0,
				duration,
				stagger,
				ease: 'power3.out'
			});
		}
	});

	return {
		destroy() {
			trigger.kill();
		}
	};
}

/** Svelte action: count up a number */
export function countUp(node: HTMLElement, options?: { target?: number; duration?: number }) {
	const target = options?.target ?? parseInt(node.textContent ?? '0', 10);
	const duration = options?.duration ?? 2;

	const obj = { val: 0 };

	const trigger = ScrollTrigger.create({
		trigger: node,
		start: 'top 85%',
		once: true,
		onEnter: () => {
			gsap.to(obj, {
				val: target,
				duration,
				ease: 'power2.out',
				onUpdate: () => {
					node.textContent = Math.round(obj.val).toLocaleString();
				}
			});
		}
	});

	return {
		destroy() {
			trigger.kill();
		}
	};
}

/** Svelte action: parallax float effect */
export function parallaxFloat(node: HTMLElement, options?: { intensity?: number }) {
	const intensity = options?.intensity ?? 20;

	const anim = gsap.to(node, {
		y: `+=${intensity}`,
		duration: 3,
		ease: 'sine.inOut',
		yoyo: true,
		repeat: -1
	});

	return {
		destroy() {
			anim.kill();
		}
	};
}
