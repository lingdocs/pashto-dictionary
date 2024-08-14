/**
 * Copyright (c) lingdocs.com
 *
 * This source code is licensed under the GPL3 license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// eslint-disable-next-line
import { Link } from "react-router-dom";

interface IBottomNavItemProps {
  icon: string;
  label: string;
  page?: string;
  handleClick?: () => void;
}

const BottomNavItem = ({
  icon,
  label,
  page,
  handleClick,
}: IBottomNavItemProps) => {
  const dataTestId = `navItem${label}`;
  if (page) {
    return (
      <Link to={page} className="plain-link">
        <div className="bottom-nav-item" data-testid={dataTestId}>
          <i className={`fa fa-${icon}`}></i>
          <div data-testid="nav-item-label">{label}</div>
        </div>
      </Link>
    );
  } else {
    return (
      <div
        className="bottom-nav-item clickable"
        onClick={handleClick}
        data-testid={dataTestId}
      >
        <i className={`fa fa-${icon}`}></i>
        <div data-testid="nav-item-label">{label}</div>
      </div>
    );
  }
};

export default BottomNavItem;
