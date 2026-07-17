type ButtonVariant = 'default' | 'primary' | 'outline' | 'ghost' | 'tonal' | 'text';

type ButtonProps = {
	href?: string;
	variant?: ButtonVariant;
	class?: string;
	children: JSX.Element | JSX.Element[] | string;
};

export const Button = ({ href, variant = 'default', class: className, children }: ButtonProps) => {
	const classes = ['button', `button--${variant}`, className].filter(Boolean).join(' ');

	if (href) {
		return (
			<a href={href} class={classes}>
				{children}
			</a>
		);
	}

	return (
		<button type="button" class={classes}>
			{children}
		</button>
	);
};
