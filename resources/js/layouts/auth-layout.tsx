import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';
import { BrandProvider } from '@/contexts/brand-context';
import { useFlashMessages } from '@/hooks/useFlashMessages';

export default function AuthLayout({
    children,
    title,
    description,
    maxWidthClass,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
    maxWidthClass?: string;
}) {
    useFlashMessages();
    return (
        <BrandProvider>
            <AuthLayoutTemplate title={title} description={description} maxWidthClass={maxWidthClass} {...props}>
                {children}
            </AuthLayoutTemplate>
        </BrandProvider>
    );
}