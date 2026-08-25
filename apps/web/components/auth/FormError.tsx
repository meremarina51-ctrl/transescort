import { FC } from "react";

interface IProps {
    error: string;
}

export const FormError: FC<IProps> = ({ error }) => (
    <>
        {error ? <p className="font-body text-sm text-red-400">{error}</p> : null}
    </>
);
