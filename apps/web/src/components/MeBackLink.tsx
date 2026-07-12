import { Link, useLocation } from 'react-router-dom';
import { inferMeDimension, meHomePath, type MeDimension } from './meRoutes';

export function MeBackLink({ dim }: { dim?: MeDimension }) {
  const { pathname } = useLocation();
  const target = meHomePath(dim ?? inferMeDimension(pathname));
  const label = (dim ?? inferMeDimension(pathname)) === 'team' ? '返回团队' : '返回个人';

  return (
    <Link
      to={target}
      className="inline-block text-sm text-graphite hover:text-champagne tracking-wider mb-6 transition-colors"
    >
      ← {label}
    </Link>
  );
}
