import { Link, useLocation } from 'react-router-dom';
import { inferMeDimension, meHomePath, type MeDimension } from './meRoutes';

export function MeBackLink({ dim }: { dim?: MeDimension }) {
  const { pathname } = useLocation();
  const target = meHomePath(dim ?? inferMeDimension(pathname));
  const label = (dim ?? inferMeDimension(pathname)) === 'team' ? '返回团队' : '返回个人';

  return (
    <Link
      to={target}
      className="inline-flex items-center gap-2 text-sm font-medium text-mist hover:text-bronze mb-8 transition-colors group"
    >
      <span className="group-hover:-translate-x-0.5 transition-transform" aria-hidden>
        ←
      </span>
      {label}
    </Link>
  );
}
