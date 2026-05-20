export interface MenuItem {
  iconPath: string;
  pageId: number;
  eName: string;
  subMenu?: MenuItem[];
  subMenus?: MenuItem[];
}

export interface LoginResponse {
  status: string;
  code: number;
  message: string;
  data: any;
}
